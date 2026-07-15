import { C as __toESM, t as require_jsx_runtime, y as require_react } from "../index.js";
//#region app/admin/AdminDashboard.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var tabs = [
	{
		value: "pending",
		label: "Pending"
	},
	{
		value: "change_proposed",
		label: "Time proposed"
	},
	{
		value: "confirmed",
		label: "Confirmed"
	},
	{
		value: "completed",
		label: "Completed"
	},
	{
		value: "cancelled",
		label: "Cancelled"
	},
	{
		value: "declined",
		label: "Declined"
	}
];
var fmt = (value) => value ? new Intl.DateTimeFormat("en-US", {
	timeZone: "America/Boise",
	dateStyle: "medium",
	timeStyle: "short"
}).format(new Date(value)) : "—";
function boiseLocalToIso(value) {
	const [date, time] = value.split("T"), [year, month, day] = date.split("-").map(Number), [hour, minute] = time.split(":").map(Number), target = Date.UTC(year, month - 1, day, hour, minute);
	let epoch = target;
	for (let i = 0; i < 4; i++) {
		const parts = new Intl.DateTimeFormat("en-US", {
			timeZone: "America/Boise",
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hourCycle: "h23"
		}).formatToParts(epoch), part = (type) => Number(parts.find((item) => item.type === type)?.value), correction = target - Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"));
		epoch += correction;
		if (!correction) break;
	}
	return new Date(epoch).toISOString();
}
function AdminDashboard({ userName, signOutPath }) {
	const [status, setStatus] = (0, import_react.useState)("pending"), [bookings, setBookings] = (0, import_react.useState)([]), [selected, setSelected] = (0, import_react.useState)(""), [detail, setDetail] = (0, import_react.useState)(null), [history, setHistory] = (0, import_react.useState)([]), [loading, setLoading] = (0, import_react.useState)(true), [error, setError] = (0, import_react.useState)(""), [action, setAction] = (0, import_react.useState)(null), [reason, setReason] = (0, import_react.useState)(""), [proposed, setProposed] = (0, import_react.useState)(""), [profileLink, setProfileLink] = (0, import_react.useState)(""), [privateLinkLabel, setPrivateLinkLabel] = (0, import_react.useState)("Style Profile"), [manualProfileType, setManualProfileType] = (0, import_react.useState)("under_40"), [profileReview, setProfileReview] = (0, import_react.useState)(null), [profileAnswers, setProfileAnswers] = (0, import_react.useState)({}), [originalProfileAnswers, setOriginalProfileAnswers] = (0, import_react.useState)({});
	const loadList = (0, import_react.useCallback)(async () => {
		setLoading(true);
		setError("");
		try {
			const r = await fetch(`/api/admin/bookings?status=${status}`, { cache: "no-store" }), p = await r.json();
			if (!r.ok) throw new Error(p.error?.message);
			setBookings(p.data.bookings);
			setSelected((current) => p.data.bookings.some((b) => b.id === current) ? current : p.data.bookings[0]?.id || "");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Requests could not be loaded.");
		} finally {
			setLoading(false);
		}
	}, [status]);
	const loadDetail = (0, import_react.useCallback)(async () => {
		if (!selected) {
			setDetail(null);
			setHistory([]);
			return;
		}
		try {
			const r = await fetch(`/api/admin/bookings/${selected}`, { cache: "no-store" }), p = await r.json();
			if (!r.ok) throw new Error(p.error?.message);
			setDetail(p.data.booking);
			setHistory(p.data.history);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Request details could not be loaded.");
		}
	}, [selected]);
	(0, import_react.useEffect)(() => {
		Promise.resolve().then(loadList);
	}, [loadList]);
	(0, import_react.useEffect)(() => {
		Promise.resolve().then(loadDetail);
	}, [loadDetail]);
	async function mutate(name) {
		if (!detail) return;
		setError("");
		try {
			const body = {
				expectedStatus: detail.status,
				reason: reason || null
			};
			if (name === "propose-time") body.requestedStartAt = boiseLocalToIso(proposed);
			const r = await fetch(`/api/admin/bookings/${detail.id}/${name}`, {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"idempotency-key": crypto.randomUUID()
				},
				body: JSON.stringify(body)
			}), p = await r.json();
			if (!r.ok) throw new Error(p.error?.message);
			if (p.data?.profileAccessUrl) {
				setProfileLink(p.data.profileAccessUrl);
				setPrivateLinkLabel("Style Profile");
			}
			if (p.data?.clientActionUrl) {
				setProfileLink(p.data.clientActionUrl);
				setPrivateLinkLabel("Alternate-time response");
			}
			setAction(null);
			setReason("");
			setProposed("");
			await loadList();
		} catch (e) {
			setError(e instanceof Error ? e.message : "The request could not be updated.");
		}
	}
	async function reopenProfile() {
		if (!detail || !reason) return;
		setError("");
		try {
			const r = await fetch(`/api/admin/bookings/${detail.id}/reopen-profile`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ reason })
			}), p = await r.json();
			if (!r.ok) throw new Error(p.error?.message);
			setProfileLink(p.data.profileAccessUrl);
			setPrivateLinkLabel("Style Profile");
			setReason("");
		} catch (e) {
			setError(e instanceof Error ? e.message : "The profile could not be reopened.");
		}
	}
	async function selectProfileType() {
		if (!detail || !reason) return;
		setError("");
		try {
			const r = await fetch(`/api/admin/bookings/${detail.id}/select-profile-type`, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					expectedStatus: detail.status,
					profileType: manualProfileType,
					reason
				})
			}), p = await r.json();
			if (!r.ok) throw new Error(p.error?.message);
			setReason("");
			await loadDetail();
		} catch (e) {
			setError(e instanceof Error ? e.message : "The profile route could not be saved.");
		}
	}
	async function loadProfile() {
		if (!detail) return;
		setError("");
		try {
			const r = await fetch(`/api/admin/bookings/${detail.id}/profile`, { cache: "no-store" }), p = await r.json();
			if (!r.ok) throw new Error(p.error?.message);
			setProfileReview(p.data);
			setProfileAnswers(p.data.profile.answers);
			setOriginalProfileAnswers(p.data.profile.answers);
		} catch (e) {
			setError(e instanceof Error ? e.message : "The profile could not be loaded.");
		}
	}
	function setProfileAnswer(key, value) {
		setProfileAnswers((current) => ({
			...current,
			[key]: value
		}));
	}
	function toggleProfileAnswer(key, value) {
		const current = Array.isArray(profileAnswers[key]) ? profileAnswers[key] : [];
		setProfileAnswer(key, current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
	}
	function profileAnswerIncludes(key, value) {
		const answer = profileAnswers[key];
		return Array.isArray(answer) && answer.includes(value);
	}
	async function correctProfile() {
		if (!detail || !reason) return;
		const changedKeys = Object.keys(profileAnswers).filter((key) => JSON.stringify(profileAnswers[key]) !== JSON.stringify(originalProfileAnswers[key]));
		if (!changedKeys.length) {
			setError("Change at least one profile answer before saving.");
			return;
		}
		setError("");
		try {
			const r = await fetch(`/api/admin/bookings/${detail.id}/profile`, {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					answers: profileAnswers,
					changedKeys,
					reason
				})
			}), p = await r.json();
			if (!r.ok) throw new Error(p.error?.message);
			setReason("");
			await loadProfile();
		} catch (e) {
			setError(e instanceof Error ? e.message : "The profile correction could not be saved.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "admin-shell",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "admin-header",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "eyebrow",
						children: "STYLE WITH KAYLA"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Appointment requests" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Signed in as ", userName] })
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "admin-header-links",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/admin/availability",
							children: "Manage availability"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/admin/privacy",
							children: "Privacy operations"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: signOutPath,
							children: "Sign out"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "admin-tabs",
				children: tabs.map((tab) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					className: status === tab.value ? "active" : "",
					onClick: () => {
						setStatus(tab.value);
						setSelected("");
					},
					children: tab.label
				}, tab.value))
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "booking-error",
				role: "alert",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "admin-layout",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "request-list",
					"aria-label": "Appointment requests",
					children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Loading requests…" }) : bookings.length ? bookings.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: selected === b.id ? "selected" : "",
						onClick: () => {
							setSelected(b.id);
							setProfileReview(null);
							setProfileLink("");
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: b.clientName }), b.overdue && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: "Overdue" })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: b.serviceName }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: fmt(b.proposedStartAt || b.requestedStartAt) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [
								b.publicReference,
								" · ",
								b.holdActive ? "Time held" : "No active hold"
							] })
						]
					}, b.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						"No ",
						status.replace("_", " "),
						" requests."
					] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "request-detail",
					children: detail ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "detail-heading",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "small-label",
									children: detail.publicReference
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: detail.clientName }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: detail.serviceName })
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `status-pill ${detail.status}`,
								children: detail.status.replace("_", " ")
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Requested time" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: fmt(detail.requestedStartAt) })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Active hold" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: fmt(detail.activeHoldStartsAt) })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Contact" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: `mailto:${detail.clientEmail}`,
									children: detail.clientEmail
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								detail.clientPhone
							] })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Client" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: detail.returningClient ? "Returning client" : `New client · ${detail.howHeard || "source not provided"}` })] }),
							detail.profileType && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Profile route" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: detail.profileType.replace("_", " ") })] }),
							detail.eventType && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Event" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
								detail.eventType,
								" · ",
								detail.eventDate
							] })] }),
							detail.bookingNotes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "wide",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Notes" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: detail.bookingNotes })]
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "admin-export",
							href: `/api/admin/bookings/${detail.id}/export`,
							children: "Download complete JSON record"
						}),
						profileLink && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "profile-link-result",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
									"Private ",
									privateLinkLabel,
									" link"
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "This private link is shown only now. Copy it into the client message." }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									readOnly: true,
									value: profileLink
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => void navigator.clipboard.writeText(profileLink),
									children: "Copy link"
								})
							]
						}),
						detail.ageRange === "manual_review" && !detail.profileType && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "action-panel",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Select Style Profile route" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Profile type", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: manualProfileType,
									onChange: (e) => setManualProfileType(e.target.value),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "under_40",
											children: "Women under 40"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "over_40",
											children: "Women 40 or older"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "womens_event",
											children: "Women's event"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "mens_styling",
											children: "Men's styling"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "mens_event",
											children: "Men's event"
										})
									]
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Reason *", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									value: reason,
									onChange: (e) => setReason(e.target.value)
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "primary-button",
									disabled: !reason,
									onClick: () => void selectProfileType(),
									children: "Save route"
								}) })
							]
						}),
						detail.status === "confirmed" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "action-panel",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Reopen or reissue Style Profile" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Reason *", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									value: reason,
									onChange: (e) => setReason(e.target.value)
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "primary-button",
									disabled: !reason,
									onClick: () => void reopenProfile(),
									children: "Create new 30-day link"
								}) })
							]
						}),
						detail.status === "confirmed" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "action-panel",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Review Style Profile" }), !profileReview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => void loadProfile(),
								children: "Load profile and history"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
									"Status: ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: profileReview.profile.status }),
									" · ",
									profileReview.profile.profileType.replace("_", " ")
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "admin-profile-fields",
									children: profileReview.schema.map((section) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: section.title }), section.questions.filter((question) => (!question.returningOnly || profileReview.profile.returningClient) && (!question.showUnless || profileAnswers[question.showUnless.key] !== question.showUnless.value)).map((question) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [question.label, question.options ? question.kind.includes("multi") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "admin-choice-list",
										children: question.options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											"aria-pressed": profileAnswerIncludes(question.key, option),
											onClick: () => toggleProfileAnswer(question.key, option),
											children: option
										}, option))
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: String(profileAnswers[question.key] ?? ""),
										onChange: (event) => setProfileAnswer(question.key, event.target.value),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "Choose…"
										}), question.options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: option }, option))]
									}) : question.kind === "long_text" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										value: String(profileAnswers[question.key] ?? ""),
										onChange: (event) => setProfileAnswer(question.key, event.target.value)
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: question.kind === "date" ? "date" : "text",
										value: String(profileAnswers[question.key] ?? ""),
										onChange: (event) => setProfileAnswer(question.key, event.target.value)
									})] }, question.key))] }, section.title))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Correction reason *", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									value: reason,
									onChange: (e) => setReason(e.target.value)
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "primary-button",
									disabled: !reason,
									onClick: () => void correctProfile(),
									children: "Save audited correction"
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "history",
									children: profileReview.revisions.map((revision) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: revision.action.replace("_", " ") }),
										" · ",
										fmt(revision.createdAt),
										revision.note && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}), revision.note] })
									] }, revision.id))
								})
							] })]
						}),
						detail.status === "confirmed" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "action-panel",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Appointment lifecycle" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Reason for cancellation, or optional completion note", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									value: reason,
									onChange: (e) => setReason(e.target.value)
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "danger",
									disabled: !reason,
									onClick: () => void mutate("cancel"),
									children: "Cancel appointment"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "primary-button",
									onClick: () => void mutate("complete"),
									children: "Mark completed"
								})] })
							]
						}),
						(detail.status === "pending" || detail.status === "change_proposed") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "admin-actions",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "primary-button",
									disabled: !detail.activeHoldStartsAt || !detail.profileType,
									onClick: () => void mutate("confirm"),
									children: "Confirm appointment"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setAction("propose-time"),
									children: "Propose another time"
								}),
								detail.activeHoldStartsAt && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => void mutate("release-hold"),
									children: "Release hold"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "danger",
									onClick: () => setAction("decline"),
									children: "Decline"
								})
							]
						}),
						action && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "action-panel",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: action === "decline" ? "Decline request" : "Propose another time" }),
								action === "propose-time" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Boise date and time", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "datetime-local",
									value: proposed,
									onChange: (e) => setProposed(e.target.value)
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
									"Reason ",
									action === "decline" && "*",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										value: reason,
										onChange: (e) => setReason(e.target.value)
									})
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setAction(null),
									children: "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "primary-button",
									disabled: action === "decline" && !reason || action === "propose-time" && !proposed,
									onClick: () => void mutate(action),
									children: "Save"
								})] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "history",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Request history" }), history.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.toStatus.replace("_", " ") }),
								" · ",
								fmt(item.createdAt),
								item.reason && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}), item.reason] })
							] }, item.id))]
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Select a request to review it." })
				})]
			})
		]
	});
}
//#endregion
export { AdminDashboard as default };
