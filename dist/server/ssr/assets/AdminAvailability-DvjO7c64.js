import { C as __toESM, t as require_jsx_runtime, y as require_react } from "../index.js";
//#region app/admin/availability/AdminAvailability.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var days = [
	[2, "Tuesday"],
	[3, "Wednesday"],
	[4, "Thursday"],
	[5, "Friday"],
	[6, "Saturday"]
];
var asTime = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`, asMinutes = (value) => {
	const [h, m] = value.split(":").map(Number);
	return h * 60 + m;
};
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
var fmt = (value) => new Intl.DateTimeFormat("en-US", {
	timeZone: "America/Boise",
	dateStyle: "medium",
	timeStyle: "short"
}).format(new Date(value));
function AdminAvailability({ userName, signOutPath }) {
	const [rules, setRules] = (0, import_react.useState)([]), [overrides, setOverrides] = (0, import_react.useState)([]), [error, setError] = (0, import_react.useState)(""), [saved, setSaved] = (0, import_react.useState)(""), [kind, setKind] = (0, import_react.useState)("unavailable"), [startsAt, setStartsAt] = (0, import_react.useState)(""), [endsAt, setEndsAt] = (0, import_react.useState)(""), [note, setNote] = (0, import_react.useState)("");
	const load = (0, import_react.useCallback)(async () => {
		setError("");
		try {
			const r = await fetch("/api/admin/settings/availability", { cache: "no-store" }), p = await r.json();
			if (!r.ok) throw new Error(p.error?.message);
			setRules(p.data.rules);
			setOverrides(p.data.overrides);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Availability could not be loaded.");
		}
	}, []);
	(0, import_react.useEffect)(() => {
		Promise.resolve().then(load);
	}, [load]);
	function change(day, index, key, value) {
		const target = rules.filter((rule) => rule.weekday === day)[index];
		setRules(rules.map((rule) => rule === target ? {
			...rule,
			[key]: asMinutes(value)
		} : rule));
	}
	function addWindow(day) {
		setRules((current) => [...current, {
			weekday: day,
			startMinute: 630,
			endMinute: 810
		}]);
	}
	function removeWindow(day, index) {
		const target = rules.filter((rule) => rule.weekday === day)[index];
		setRules((current) => current.filter((rule) => rule !== target));
	}
	async function saveRules() {
		setError("");
		setSaved("");
		try {
			const r = await fetch("/api/admin/settings/availability", {
				method: "PUT",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ rules })
			}), p = await r.json();
			if (!r.ok) throw new Error(p.error?.message);
			setSaved("Routine availability saved.");
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Routine availability could not be saved.");
		}
	}
	async function addOverride() {
		setError("");
		try {
			const r = await fetch("/api/admin/settings/availability/overrides", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					kind,
					startsAt: boiseLocalToIso(startsAt),
					endsAt: boiseLocalToIso(endsAt),
					note: note || null
				})
			}), p = await r.json();
			if (!r.ok) throw new Error(p.error?.message);
			setStartsAt("");
			setEndsAt("");
			setNote("");
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Override could not be added.");
		}
	}
	async function removeOverride(id) {
		setError("");
		try {
			const r = await fetch(`/api/admin/settings/availability/overrides/${id}`, { method: "DELETE" }), p = await r.json();
			if (!r.ok) throw new Error(p.error?.message);
			await load();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Override could not be removed.");
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
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "Availability settings" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Times are shown in America/Boise · Signed in as ", userName] })
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "admin-header-links",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/admin",
						children: "Appointment requests"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: signOutPath,
						children: "Sign out"
					})]
				})]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "booking-error",
				role: "alert",
				children: error
			}),
			saved && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "admin-success",
				role: "status",
				children: saved
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "availability-card",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "availability-title",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "small-label",
						children: "ROUTINE WINDOWS"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Weekly availability" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "primary-button",
						onClick: () => void saveRules(),
						children: "Save routine"
					})]
				}), days.map(([day, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "availability-day",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [rules.filter((rule) => rule.weekday === day).map((rule, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "window-row",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								"aria-label": `${label} start`,
								type: "time",
								value: asTime(rule.startMinute),
								onChange: (e) => change(day, index, "startMinute", e.target.value)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "to" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								"aria-label": `${label} end`,
								type: "time",
								value: asTime(rule.endMinute),
								onChange: (e) => change(day, index, "endMinute", e.target.value)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => removeWindow(day, index),
								children: "Remove"
							})
						]
					}, `${day}-${index}`)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "add-window",
						onClick: () => addWindow(day),
						children: "+ Add window"
					})] })]
				}, day))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "availability-card",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "small-label",
						children: "ONE-OFF CHANGES"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Availability overrides" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "override-form",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Type", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: kind,
								onChange: (e) => setKind(e.target.value),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "unavailable",
									children: "Block time"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "available",
									children: "Add available time"
								})]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Starts", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "datetime-local",
								value: startsAt,
								onChange: (e) => setStartsAt(e.target.value)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: ["Ends", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "datetime-local",
								value: endsAt,
								onChange: (e) => setEndsAt(e.target.value)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "wide",
								children: ["Note", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: note,
									onChange: (e) => setNote(e.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "primary-button",
								disabled: !startsAt || !endsAt,
								onClick: () => void addOverride(),
								children: "Add override"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "override-list",
						children: overrides.length ? overrides.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `status-pill ${item.kind}`,
								children: item.kind
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: fmt(item.startsAt) }),
								" to ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: fmt(item.endsAt) }),
								item.note && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}), item.note] })
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => void removeOverride(item.id),
								children: "Remove"
							})
						] }, item.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "No upcoming overrides." })
					})
				]
			})
		]
	});
}
//#endregion
export { AdminAvailability as default };
