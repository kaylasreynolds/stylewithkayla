import { C as __toESM, t as require_jsx_runtime, y as require_react } from "../index.js";
//#region app/admin/privacy/AdminPrivacy.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var fmt = (value) => value ? new Intl.DateTimeFormat("en-US", {
	timeZone: "America/Boise",
	dateStyle: "medium",
	timeStyle: "short"
}).format(new Date(value)) : "—";
function AdminPrivacy({ userName, signOutPath }) {
	const [requests, setRequests] = (0, import_react.useState)([]), [summary, setSummary] = (0, import_react.useState)(null), [filter, setFilter] = (0, import_react.useState)("active"), [selected, setSelected] = (0, import_react.useState)(""), [email, setEmail] = (0, import_react.useState)(""), [kind, setKind] = (0, import_react.useState)("access"), [details, setDetails] = (0, import_react.useState)(""), [note, setNote] = (0, import_react.useState)(""), [error, setError] = (0, import_react.useState)(""), [notice, setNotice] = (0, import_react.useState)(""), [busy, setBusy] = (0, import_react.useState)(false);
	const current = requests.find((item) => item.id === selected) ?? null;
	const load = (0, import_react.useCallback)(async () => {
		setError("");
		try {
			const [requestsResponse, summaryResponse] = await Promise.all([fetch(`/api/admin/data-requests?status=${filter}`, { cache: "no-store" }), fetch("/api/admin/operations/maintenance", { cache: "no-store" })]), requestsPayload = await requestsResponse.json(), summaryPayload = await summaryResponse.json();
			if (!requestsResponse.ok) throw new Error(requestsPayload.error?.message);
			if (!summaryResponse.ok) throw new Error(summaryPayload.error?.message);
			setRequests(requestsPayload.data.requests);
			setSummary(summaryPayload.data);
			setSelected((id) => requestsPayload.data.requests.some((item) => item.id === id) ? id : requestsPayload.data.requests[0]?.id ?? "");
		} catch (e) {
			setError(e instanceof Error ? e.message : "Privacy operations could not be loaded.");
		}
	}, [filter]);
	(0, import_react.useEffect)(() => {
		Promise.resolve().then(load);
	}, [load]);
	async function createRequest() {
		setBusy(true);
		setError("");
		setNotice("");
		try {
			const response = await fetch("/api/admin/data-requests", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					clientEmail: email,
					kind,
					requestDetails: details || null
				})
			}), payload = await response.json();
			if (!response.ok) throw new Error(payload.error?.message);
			setEmail("");
			setDetails("");
			setNotice("Privacy request recorded.");
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : "The privacy request could not be recorded.");
		} finally {
			setBusy(false);
		}
	}
	async function updateRequest(status) {
		if (!current) return;
		if (status === "completed" && current.kind === "deletion" && !window.confirm("This permanently removes the client’s written booking and Style Profile data. Continue?")) return;
		setBusy(true);
		setError("");
		setNotice("");
		try {
			const response = await fetch(`/api/admin/data-requests/${current.id}`, {
				method: "PATCH",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					status,
					resolutionNote: note
				})
			}), payload = await response.json();
			if (!response.ok) throw new Error(payload.error?.message);
			setNote("");
			setNotice(payload.data?.clientDataDeleted ? "Client data deleted and the minimal request audit retained." : "Privacy request updated.");
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : "The privacy request could not be updated.");
		} finally {
			setBusy(false);
		}
	}
	async function runMaintenance() {
		if (!window.confirm("Run expired-link revocation and due retention deletion now?")) return;
		setBusy(true);
		setError("");
		setNotice("");
		try {
			const response = await fetch("/api/admin/operations/maintenance", { method: "POST" }), payload = await response.json();
			if (!response.ok) throw new Error(payload.error?.message);
			setNotice(`Maintenance completed: ${payload.data.revokedExpiredTokenCount} expired links revoked and ${payload.data.deletedClientCount} due client records deleted.`);
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Maintenance could not be completed.");
		} finally {
			setBusy(false);
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Privacy operations" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Signed in as ", userName] })
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "admin-header-links",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/admin",
							children: "Appointment requests"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "/admin/availability",
							children: "Availability"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: signOutPath,
							children: "Sign out"
						})
					]
				})]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "booking-error",
				role: "alert",
				children: error
			}),
			notice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "admin-notice",
				role: "status",
				children: notice
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "operations-summary",
				"aria-label": "Maintenance summary",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Open requests" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: summary?.openDataRequestCount ?? "—" })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Expired private links" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: summary?.expiredTokenCount ?? "—" })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Records due for deletion" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: summary?.dueClientCount ?? "—" })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "primary-button",
						disabled: busy,
						onClick: () => void runMaintenance(),
						children: "Run maintenance now"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "privacy-create action-panel",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Record a client request" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Use the email already stored with the client. Contact remains the intake path; this creates the auditable work item." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "privacy-form",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Client email", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "email",
								value: email,
								onChange: (event) => setEmail(event.target.value)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Request type", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: kind,
								onChange: (event) => setKind(event.target.value),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "access",
										children: "Access"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "correction",
										children: "Correction"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "deletion",
										children: "Deletion"
									})
								]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "wide",
								children: ["Request details", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									value: details,
									onChange: (event) => setDetails(event.target.value),
									maxLength: 2e3
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "primary-button",
						disabled: busy || !email,
						onClick: () => void createRequest(),
						children: "Record request"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "privacy-toolbar",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Show ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					value: filter,
					onChange: (event) => {
						setFilter(event.target.value);
						setSelected("");
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "active",
							children: "Open and in progress"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "all",
							children: "All requests"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "completed",
							children: "Completed"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "declined",
							children: "Declined"
						})
					]
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "admin-layout",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "request-list",
					"aria-label": "Privacy requests",
					children: requests.length ? requests.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: selected === item.id ? "selected" : "",
						onClick: () => {
							setSelected(item.id);
							setNote("");
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.clientName }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { children: item.kind })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.clientEmail }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: fmt(item.requestedAt) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("small", { children: [item.status.replace("_", " "), item.activeBookingCount ? ` · ${item.activeBookingCount} active appointment` : ""] })
						]
					}, item.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "No matching privacy requests." })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "request-detail",
					children: current ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "detail-heading",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "small-label",
									children: [current.kind, " request"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: current.clientName }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: current.clientEmail })
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "status-pill",
								children: current.status.replace("_", " ")
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Received" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: fmt(current.requestedAt) })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Active appointments" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: current.activeBookingCount })] }),
							current.requestDetails && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "wide",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Request details" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: current.requestDetails })]
							}),
							current.resolutionNote && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "wide",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "Resolution" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: current.resolutionNote })]
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "admin-export",
							href: `/api/admin/data-requests/${current.id}/export`,
							children: "Download client data export"
						}),
						new Set(["open", "in_progress"]).has(current.status) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "action-panel",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Resolve request" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
									"Resolution note ",
									current.status === "in_progress" ? "(required to close)" : "",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										value: note,
										onChange: (event) => setNote(event.target.value),
										maxLength: 2e3
									})
								] }),
								current.kind === "deletion" && current.activeBookingCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "warning-copy",
									children: "Deletion is blocked until active appointments are cancelled or declined."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										disabled: busy || current.status === "in_progress",
										onClick: () => void updateRequest("in_progress"),
										children: "Mark in progress"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: "primary-button",
										disabled: busy || !note || current.kind === "deletion" && current.activeBookingCount > 0,
										onClick: () => void updateRequest("completed"),
										children: current.kind === "deletion" ? "Complete and delete data" : "Complete request"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: "danger",
										disabled: busy || !note,
										onClick: () => void updateRequest("declined"),
										children: "Decline"
									})
								] })
							]
						})
					] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Select a request to review it." })
				})]
			})
		]
	});
}
//#endregion
export { AdminPrivacy as default };
