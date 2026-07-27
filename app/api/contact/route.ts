import { env } from "cloudflare:workers";
import {
  ApiError,
  dataResponse,
  optionalString,
  readJsonObject,
  rejectUnexpectedKeys,
  requiredString,
  validation,
  withApi,
} from "@/lib/server/http";
import { sha256 } from "@/lib/server/crypto";
import { getD1 } from "@/lib/server/runtime";

type ContactEmailBinding = {
  send(message: {
    from: string;
    to?: string;
    replyTo?: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<{ messageId?: string }>;
};

type ContactRuntimeEnv = {
  CONTACT_EMAIL?: ContactEmailBinding;
};

const inquiryTypes = new Set([
  "Custom appointment",
  "Partnership or event",
  "Existing appointment",
  "General question",
]);

const contactMethods = new Set(["Email", "Phone", "Text message"]);

export async function POST(request: Request) {
  return withApi(async (requestId) => {
    const body = await readJsonObject(request);
    rejectUnexpectedKeys(body, [
      "inquiryType",
      "fullName",
      "email",
      "phone",
      "preferredContactMethod",
      "message",
      "website",
    ]);

    // Honeypot field. Bots commonly fill hidden inputs.
    if (typeof body.website === "string" && body.website.trim()) {
      return dataResponse({ received: true }, 201, requestId);
    }

    const inquiryType = requiredString(body.inquiryType, "inquiryType", 80);
    if (!inquiryTypes.has(inquiryType)) {
      throw validation("inquiryType", "Choose one of the available inquiry types.");
    }

    const fullName = requiredString(body.fullName, "fullName", 120);
    const email = requiredString(body.email, "email", 254);
    const normalizedEmail = email.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      throw validation("email", "Enter a valid email address.");
    }

    const phone = optionalString(body.phone, "phone", 40);
    if (phone) {
      const normalizedPhone = phone.replace(/\D/g, "");
      if (normalizedPhone.length < 7 || normalizedPhone.length > 15) {
        throw validation("phone", "Enter a valid phone number.");
      }
    }

    const preferredContactMethod = requiredString(
      body.preferredContactMethod,
      "preferredContactMethod",
      40,
    );
    if (!contactMethods.has(preferredContactMethod)) {
      throw validation("preferredContactMethod", "Choose one of the available contact methods.");
    }

    const message = requiredString(body.message, "message", 4000);
    const db = getD1();
    const now = Date.now();
    const id = crypto.randomUUID();
    const ip =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const sourceIpHash = await sha256(ip);

    const recent = await db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM contact_inquiries
         WHERE source_ip_hash = ? AND created_at >= ?`,
      )
      .bind(sourceIpHash, now - 60 * 60 * 1000)
      .first<{ count: number }>();

    if ((recent?.count ?? 0) >= 5) {
      throw new ApiError(
        429,
        "RATE_LIMITED",
        "Too many messages were submitted. Please try again later.",
      );
    }

    await db
      .prepare(
        `INSERT INTO contact_inquiries (
          id, inquiry_type, full_name, email, normalized_email, phone,
          preferred_contact_method, message, status, notification_status,
          source_ip_hash, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unread', 'pending', ?, ?, ?)`,
      )
      .bind(
        id,
        inquiryType,
        fullName,
        email,
        normalizedEmail,
        phone,
        preferredContactMethod,
        message,
        sourceIpHash,
        now,
        now,
      )
      .run();

    let notificationStatus = "unavailable";
    const emailBinding = (env as unknown as ContactRuntimeEnv).CONTACT_EMAIL;

    if (emailBinding) {
      try {
        const safeSubjectName = fullName.replace(/[\r\n]+/g, " ").slice(0, 80);
        const text = [
          "New website contact inquiry",
          "",
          `Inquiry type: ${inquiryType}`,
          `Name: ${fullName}`,
          `Email: ${email}`,
          `Phone: ${phone ?? "Not provided"}`,
          `Preferred contact method: ${preferredContactMethod}`,
          "",
          "Message:",
          message,
          "",
          `Submission ID: ${id}`,
        ].join("\n");

        const result = await emailBinding.send({
          from: "Style with Kayla Website <kayla@stylewithkayla.com>",
          to: "kayla@stylewithkayla.com",
          replyTo: email,
          subject: `New contact inquiry from ${safeSubjectName}`,
          text,
        });

        notificationStatus = "sent";
        await db
          .prepare(
            `UPDATE contact_inquiries
             SET notification_status = 'sent', notification_message_id = ?, updated_at = ?
             WHERE id = ?`,
          )
          .bind(result.messageId ?? null, Date.now(), id)
          .run();
      } catch (error) {
        notificationStatus = "failed";
        const detail = error instanceof Error ? error.message.slice(0, 500) : "Unknown email error";
        console.error("Contact notification failed", { requestId, contactInquiryId: id, error });
        await db
          .prepare(
            `UPDATE contact_inquiries
             SET notification_status = 'failed', notification_error = ?, updated_at = ?
             WHERE id = ?`,
          )
          .bind(detail, Date.now(), id)
          .run();
      }
    } else {
      await db
        .prepare(
          `UPDATE contact_inquiries
           SET notification_status = 'unavailable', updated_at = ?
           WHERE id = ?`,
        )
        .bind(Date.now(), id)
        .run();
    }

    return dataResponse({ received: true, notificationStatus }, 201, requestId);
  });
}
