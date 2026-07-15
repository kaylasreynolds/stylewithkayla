import { C as __toESM, t as require_jsx_runtime, y as require_react } from "../index.js";
import { t as Link } from "./link-CPE6dpDr.js";
//#region app/client-actions/page.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function ClientActionsPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClientActionClient, {});
}
function ClientActionClient({ token }) {
	const [booking, setBooking] = (0, import_react.useState)(null), [error, setError] = (0, import_react.useState)(""), [loading, setLoading] = (0, import_react.useState)(Boolean(token)), [mode, setMode] = (0, import_react.useState)("choice"), [slots, setSlots] = (0, import_react.useState)([]), [selected, setSelected] = (0, import_react.useState)(""), [profileLink, setProfileLink] = (0, import_react.useState)(""), [working, setWorking] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!token) return;
		fetch(`/api/client-actions/${token}`, {
			cache: "no-store",
			referrerPolicy: "no-referrer"
		}).then(async (response) => {
			const payload = await response.json();
			if (!response.ok) throw new Error(payload.error?.message || "This private link is unavailable.");
			return payload.data.booking;
		}).then(setBooking).catch((current) => setError(current instanceof Error ? current.message : "This private link is unavailable.")).finally(() => setLoading(false));
	}, [token]);
	async function accept() {
		if (!token) return;
		setWorking(true);
		setError("");
		try {
			const response = await fetch(`/api/client-actions/${token}/accept-proposed-time`, {
				method: "POST",
				headers: { "idempotency-key": crypto.randomUUID() },
				referrerPolicy: "no-referrer"
			}), payload = await response.json();
			if (!response.ok) throw new Error(payload.error?.message || "The proposed time could not be accepted.");
			setProfileLink(payload.data.profileAccessUrl);
			setMode("confirmed");
		} catch (current) {
			setError(current instanceof Error ? current.message : "The proposed time could not be accepted.");
		} finally {
			setWorking(false);
		}
	}
	async function chooseAnother() {
		if (!booking) return;
		setMode("another");
		setWorking(true);
		setError("");
		try {
			const from = dateKey(/* @__PURE__ */ new Date()), end = /* @__PURE__ */ new Date();
			end.setDate(end.getDate() + 60);
			const response = await fetch(`/api/availability?serviceCode=${encodeURIComponent(booking.serviceCode)}&from=${from}&to=${dateKey(end)}`, { cache: "no-store" }), payload = await response.json();
			if (!response.ok) throw new Error(payload.error?.message || "Availability could not be loaded.");
			setSlots(payload.data.slots);
			setSelected(payload.data.slots[0]?.startsAt || "");
		} catch (current) {
			setError(current instanceof Error ? current.message : "Availability could not be loaded.");
		} finally {
			setWorking(false);
		}
	}
	async function requestAnother() {
		if (!token || !selected) return;
		setWorking(true);
		setError("");
		try {
			const response = await fetch(`/api/client-actions/${token}/request-another-time`, {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"idempotency-key": crypto.randomUUID()
				},
				referrerPolicy: "no-referrer",
				body: JSON.stringify({ requestedStartAt: selected })
			}), payload = await response.json();
			if (!response.ok) throw new Error(payload.error?.message || "The new time could not be requested.");
			setMode("pending");
		} catch (current) {
			setError(current instanceof Error ? current.message : "The new time could not be requested.");
		} finally {
			setWorking(false);
		}
	}
	if (!token) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ActionShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Private link required." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Please use the alternate-time link from Kayla." })] });
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Loading your appointment options…" }) });
	if (!booking) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ActionShell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Link unavailable." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: error })] });
	if (mode === "confirmed") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ActionShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "eyebrow",
			children: "APPOINTMENT CONFIRMED"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "That time is yours." }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
			"Your appointment is confirmed for ",
			format(booking.proposedStartAt),
			"."
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			className: "button primary-button",
			href: profileLink,
			children: "Complete your Style Profile"
		})
	] });
	if (mode === "pending") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ActionShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "eyebrow",
			children: "NEW TIME REQUESTED"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Thank you." }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Your new selection is pending while Kayla reviews it. The time is held in the meantime." })
	] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ActionShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "eyebrow",
			children: "APPOINTMENT TIME"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", { children: [
			"Hi, ",
			booking.clientFirstName,
			"."
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
			"Kayla proposed a different time for your ",
			booking.serviceName,
			" appointment."
		] }),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "proposed-time",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "PROPOSED TIME" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: format(booking.proposedStartAt) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Macy's Boise Towne Square" })
			]
		}),
		error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "booking-error",
			role: "alert",
			children: error
		}),
		mode === "another" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "another-time",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Choose another available time", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					value: selected,
					onChange: (event) => setSelected(event.target.value),
					children: slots.map((slot) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: slot.startsAt,
						children: format(slot.startsAt)
					}, slot.startsAt))
				})] }),
				!working && !slots.length && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "No routine times are currently available. Please contact Kayla." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "text-button",
					onClick: () => setMode("choice"),
					children: "Back"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: "button primary-button",
					disabled: !selected || working,
					onClick: () => void requestAnother(),
					children: "Request this time"
				})] })
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "client-action-buttons",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "button primary-button",
				disabled: working,
				onClick: () => void accept(),
				children: "Accept proposed time"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				className: "button secondary-button",
				disabled: working,
				onClick: () => void chooseAnother(),
				children: "Request another time"
			})]
		})
	] });
}
function ActionShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "site-shell",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "site-header",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "container header-inner",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					className: "site-logo",
					href: "/",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/images/stylewithkayla_logo.png",
						alt: "Style with Kayla"
					})
				})
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "client-action-page",
			children
		})]
	});
}
function format(value) {
	return new Intl.DateTimeFormat("en-US", {
		timeZone: "America/Boise",
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit"
	}).format(new Date(value));
}
function dateKey(value) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: "America/Boise",
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).formatToParts(value), part = (type) => parts.find((item) => item.type === type)?.value;
	return `${part("year")}-${part("month")}-${part("day")}`;
}
//#endregion
export { ClientActionClient, ClientActionsPage as default };
