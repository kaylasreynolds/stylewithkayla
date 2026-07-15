import { C as __toESM, t as require_jsx_runtime, y as require_react } from "../index.js";
import { t as Link } from "./link-CPE6dpDr.js";
//#region app/style-profile/page.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function StyleProfilePage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StyleProfileClient, {});
}
function StyleProfileClient({ token }) {
	const [profile, setProfile] = (0, import_react.useState)(null), [step, setStep] = (0, import_react.useState)(1), [answers, setAnswers] = (0, import_react.useState)({}), [submitted, setSubmitted] = (0, import_react.useState)(false), [loading, setLoading] = (0, import_react.useState)(Boolean(token)), [saving, setSaving] = (0, import_react.useState)(false), [savedAt, setSavedAt] = (0, import_react.useState)(""), [error, setError] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (!token) return;
		fetch(`/api/style-profile/${token}`, {
			cache: "no-store",
			referrerPolicy: "no-referrer"
		}).then(async (response) => {
			const payload = await response.json();
			if (!response.ok) throw new Error(payload.error?.message || "This private link is unavailable.");
			return payload.data.profile;
		}).then((current) => {
			setProfile(current);
			setStep(Math.min(current.currentSection, current.schema.length));
			setAnswers(current.answers || {});
			setSubmitted(current.status === "submitted");
		}).catch((current) => setError(current instanceof Error ? current.message : "This private link is unavailable.")).finally(() => setLoading(false));
	}, [token]);
	function update(key, value) {
		setAnswers((current) => ({
			...current,
			[key]: value
		}));
		setSavedAt("");
	}
	function toggle(question, value) {
		const current = Array.isArray(answers[question.key]) ? answers[question.key] : [], next = current.includes(value) ? current.filter((item) => item !== value) : current.length < (question.maxSelections ?? 99) ? [...current, value] : current;
		update(question.key, next);
	}
	async function save(nextStep = step) {
		if (!token || !profile || submitted) return false;
		setSaving(true);
		setError("");
		try {
			const response = await fetch(`/api/style-profile/${token}`, {
				method: "PUT",
				headers: { "content-type": "application/json" },
				referrerPolicy: "no-referrer",
				body: JSON.stringify({
					schemaVersion: profile.schemaVersion,
					currentSection: nextStep,
					answers,
					inspirationLink: typeof answers.inspiration === "string" && answers.inspiration ? answers.inspiration : null
				})
			}), payload = await response.json();
			if (!response.ok) throw new Error(payload.error?.message || "Your progress could not be saved.");
			setSavedAt(payload.data.savedAt);
			return true;
		} catch (current) {
			setError(current instanceof Error ? current.message : "Your progress could not be saved.");
			return false;
		} finally {
			setSaving(false);
		}
	}
	async function submit() {
		if (!token) return;
		if (!await save(profile?.schema.length ?? step)) return;
		setSaving(true);
		setError("");
		try {
			const response = await fetch(`/api/style-profile/${token}/submit`, {
				method: "POST",
				headers: { "idempotency-key": crypto.randomUUID() },
				referrerPolicy: "no-referrer"
			}), payload = await response.json();
			if (!response.ok) throw new Error(payload.error?.message || "Your Style Profile could not be submitted.");
			setSubmitted(true);
		} catch (current) {
			setError(current instanceof Error ? current.message : "Your Style Profile could not be submitted.");
		} finally {
			setSaving(false);
		}
	}
	function googleCalendarUrl() {
		if (!profile) return "#";
		const compact = (value) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
		return `https://calendar.google.com/calendar/render?${new URLSearchParams({
			action: "TEMPLATE",
			text: `${profile.serviceName} with Kayla`,
			dates: `${compact(profile.confirmedStartAt)}/${compact(profile.confirmedEndAt)}`,
			location: "Macy's Boise Towne Square, 370 N. Milwaukee St., Boise, ID 83704",
			details: "Complimentary personal styling appointment with Kayla Reynolds."
		})}`;
	}
	if (!token) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "profile-complete",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Private link required." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Please use the Style Profile link included with your confirmed appointment." })]
	}) });
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "profile-complete",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Loading your private Style Profile…" })
	}) });
	if (!profile) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "profile-complete",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Link unavailable." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: error })]
	}) });
	if (submitted) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "profile-complete",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "profile-complete-mark",
				children: "✓"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "eyebrow",
				children: "STYLE PROFILE COMPLETE"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", { children: [
				"You're all set, ",
				profile.clientFirstName,
				"."
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Your submitted profile is locked. Contact Kayla if something needs to change." }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Appointment, {
				profile,
				token,
				googleCalendarUrl: googleCalendarUrl()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				className: "button primary-button",
				href: "/",
				children: "Return to booking"
			})
		]
	}) });
	const section = profile.schema[step - 1], visibleQuestions = section.questions.filter((question) => (!question.returningOnly || profile.returningClient) && (!question.showUnless || answers[question.showUnless.key] !== question.showUnless.value));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "profile-page",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "profile-welcome",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "eyebrow",
					children: "YOUR STYLE PROFILE"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", { children: [
					"Hi, ",
					profile.clientFirstName,
					"."
				] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Tell me what feels like you, what does not, and what would make shopping easier. Your progress is saved as you go." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Appointment, {
					profile,
					token,
					googleCalendarUrl: googleCalendarUrl()
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "profile-workspace",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "profile-progress",
					"aria-label": `Style Profile section ${step} of ${profile.schema.length}`,
					children: profile.schema.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: step === index + 1 ? "active" : step > index + 1 ? "complete" : "",
						onClick: () => setStep(index + 1),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: step > index + 1 ? "✓" : index + 1 }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.title })]
					}, item.title))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "profile-step",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "small-label",
							children: [
								"PART ",
								step,
								" OF ",
								profile.schema.length
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: section.title }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "profile-step-intro",
							children: section.intro
						}),
						visibleQuestions.map((question, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileField, {
							question,
							value: answers[question.key],
							index,
							onChange: (value) => update(question.key, value),
							onToggle: (value) => toggle(question, value)
						}, question.key))
					]
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "booking-error",
					role: "alert",
					children: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "profile-privacy",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Your information stays private." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "It is used only to prepare for and manage your styling appointment. This link expires 30 days after it is issued. Submitting locks the profile; Kayla can reopen it if a correction is needed." })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "profile-actions",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "save-later",
							disabled: saving,
							onClick: () => void save(),
							children: "Save & finish later"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: savedAt ? "Progress saved" : "" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [step > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "text-button",
							onClick: () => setStep(step - 1),
							children: "← Back"
						}), step < profile.schema.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "button primary-button",
							disabled: saving,
							onClick: async () => {
								const next = step + 1;
								if (await save(next)) setStep(next);
							},
							children: "Continue"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "button primary-button",
							disabled: saving,
							onClick: () => void submit(),
							children: saving ? "Saving…" : "Submit Style Profile"
						})] })
					]
				})
			]
		})]
	}) });
}
function ProfileField({ question, value, index, onChange, onToggle }) {
	const label = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		question.label,
		" ",
		question.required && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			"aria-hidden": "true",
			children: "*"
		}),
		question.optional && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "Optional" })
	] });
	if (question.kind === "long_text") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
		className: "profile-question",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
			rows: 4,
			value: typeof value === "string" ? value : "",
			onChange: (event) => onChange(event.target.value),
			placeholder: question.placeholder
		})]
	});
	if (question.kind === "text" || question.kind === "link" || question.kind === "date") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
		className: "profile-question",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: question.kind === "link" ? "url" : question.kind === "date" ? "date" : "text",
			value: typeof value === "string" ? value : "",
			onChange: (event) => onChange(event.target.value),
			placeholder: question.placeholder
		})]
	});
	if (question.kind === "single") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
		className: "profile-question",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
			value: typeof value === "string" ? value : "",
			onChange: (event) => onChange(event.target.value),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
				value: "",
				children: "Select one"
			}), question.options?.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: option }, option))]
		})]
	});
	const selected = Array.isArray(value) ? value : [], single = question.kind === "visual_single", visual = single || question.kind === "visual_multi", shape = question.key === "body_shape";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
		className: "profile-question",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: label }),
			question.maxSelections && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "question-hint",
				children: [
					selected.length,
					"/",
					question.maxSelections,
					" selected · Choose up to ",
					question.maxSelections
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: shape ? "shape-grid" : visual ? "visual-answer-grid" : "answer-chips",
				children: question.options?.map((option, optionIndex) => {
					const active = single ? value === option : selected.includes(option);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						"aria-pressed": active,
						className: active ? "selected" : "",
						onClick: () => single ? onChange(option) : onToggle(option),
						children: [
							visual && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: shape ? `shape-symbol shape-${optionIndex + 1}` : `style-swatch swatch-${(index + optionIndex) % 6 + 1}`,
								"aria-hidden": "true"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: option }),
							visual && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: visualDescription(question.key, option) })
						]
					}, option);
				})
			})
		]
	});
}
function Appointment({ profile, token, googleCalendarUrl }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "confirmed-appointment",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "CONFIRMED APPOINTMENT" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: profile.serviceName }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				appointment(profile.confirmedStartAt),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
				"Macy's Boise Towne Square"
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "calendar-options",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: `/api/style-profile/${token}/calendar`,
					children: "Download calendar file"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: googleCalendarUrl,
					target: "_blank",
					rel: "noreferrer",
					children: "Add to Google Calendar"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
				href: "mailto:kayla.reynolds@macys.com?subject=Appointment%20Details",
				children: "Need to change something?"
			})
		]
	});
}
function Shell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "site-shell",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Announcement, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			children,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
function Announcement() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "announcement-bar",
		children: "Complimentary Personal Styling Appointments | 20% Off For First Time Clients*"
	});
}
function Header() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		className: "site-header",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "container header-inner",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					className: "site-logo",
					href: "/",
					"aria-label": "Style with Kayla home",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/images/stylewithkayla_logo.png",
						alt: "Style with Kayla"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					className: "site-nav",
					"aria-label": "Main navigation",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							href: "/",
							children: "Home"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							href: "/#services",
							children: "Services"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							href: "/#events",
							children: "Events"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							href: "/#about",
							children: "About Me"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#contact",
							children: "Contact"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					className: "button header-cta",
					href: "/",
					children: "BOOK APPOINTMENT"
				})
			]
		})
	});
}
function Footer() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
		className: "site-footer",
		id: "contact",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "container footer-inner",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "footer-column footer-brand",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						className: "footer-logo",
						href: "/",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: "/images/stylewithkayla_logo.png",
							alt: "Style with Kayla"
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					className: "footer-column footer-links",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "footer-kicker",
							children: "Quick Links"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							href: "/#services",
							children: "Services"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							href: "/#events",
							children: "Events"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							href: "/#about",
							children: "About Me"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "footer-column footer-contact",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "footer-kicker",
							children: "Let's Connect"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "tel:+12088596427",
							children: "208-859-6427"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "mailto:kayla.reynolds@macys.com",
							children: "kayla.reynolds@macys.com"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							"Macy's Boise Towne Square",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							"370 N. Milwaukee St.",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							"Boise, ID 83704"
						] })
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "container footer-bottom",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "© 2026 Style with Kayla" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "|" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Personal Stylist at Macy's" })
			]
		})]
	});
}
function appointment(value) {
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
function visualDescription(key, option) {
	return key === "body_shape" ? {
		Hourglass: "Balanced shoulders and hips with a defined waist",
		Pear: "Hips are fuller than shoulders",
		Apple: "Fuller through the middle",
		Rectangle: "Shoulders, waist, and hips are similar",
		"Inverted Triangle": "Shoulders are broader than hips",
		"Not sure": "Kayla can help determine the best fit direction"
	}[option] || option : `${option} visual style direction`;
}
//#endregion
export { StyleProfileClient, StyleProfilePage as default };
