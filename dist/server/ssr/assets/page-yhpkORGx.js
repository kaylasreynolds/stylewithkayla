import { C as __toESM, t as require_jsx_runtime, y as require_react } from "../index.js";
//#region app/page.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var servicePresentation = [
	{
		id: "women_event",
		audience: "Women",
		name: "Women's Event & Occasion Styling",
		shortName: "Event & Occasion Styling",
		duration: 60,
		isEvent: true,
		description: "A focused appointment for a wedding, celebration, work event, or special occasion."
	},
	{
		id: "women_everyday",
		audience: "Women",
		name: "Women's Everyday Styling",
		shortName: "Everyday Styling",
		duration: 90,
		needsAge: true,
		description: "Build polished outfits that feel natural for your day-to-day life."
	},
	{
		id: "women_closet",
		audience: "Women",
		name: "Women's Full Closet Refresh",
		shortName: "Full Closet Refresh",
		duration: 180,
		needsAge: true,
		description: "A more complete wardrobe update with time to compare and build full looks."
	},
	{
		id: "men_event",
		audience: "Men",
		name: "Men's Event & Occasion Styling",
		shortName: "Event & Occasion Styling",
		duration: 60,
		isEvent: true,
		description: "A complete event look built around the dress code, setting, and personal style."
	},
	{
		id: "men_everyday",
		audience: "Men",
		name: "Men's Everyday Styling",
		shortName: "Everyday Styling",
		duration: 90,
		description: "Practical, polished outfits for work, weekends, and everything in between."
	},
	{
		id: "men_closet",
		audience: "Men",
		name: "Men's Full Closet Refresh",
		shortName: "Full Closet Refresh",
		duration: 180,
		description: "A thoughtful wardrobe update with versatile pieces and complete outfits."
	}
];
var monthNames = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December"
];
var weekdayNames = [
	"SUN",
	"MON",
	"TUE",
	"WED",
	"THU",
	"FRI",
	"SAT"
];
function keyForDate(date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function readableDate(value) {
	if (!value) return "Not selected";
	const [year, month, day] = value.split("-").map(Number);
	return new Intl.DateTimeFormat("en-US", {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric"
	}).format(new Date(year, month - 1, day));
}
function Home() {
	const today = (0, import_react.useMemo)(() => /* @__PURE__ */ new Date(), []);
	const maxDate = (0, import_react.useMemo)(() => {
		const value = new Date(today);
		value.setDate(value.getDate() + 60);
		return value;
	}, [today]);
	const [step, setStep] = (0, import_react.useState)(1);
	const [audience, setAudience] = (0, import_react.useState)("Women");
	const [services, setServices] = (0, import_react.useState)(servicePresentation);
	const [serviceId, setServiceId] = (0, import_react.useState)("women_everyday");
	const [month, setMonth] = (0, import_react.useState)(new Date(today.getFullYear(), today.getMonth(), 1));
	const [selectedDate, setSelectedDate] = (0, import_react.useState)("");
	const [selectedTime, setSelectedTime] = (0, import_react.useState)("");
	const [slotsByDate, setSlotsByDate] = (0, import_react.useState)({});
	const [loadingTimes, setLoadingTimes] = (0, import_react.useState)(true);
	const [bookingError, setBookingError] = (0, import_react.useState)("");
	const [submitting, setSubmitting] = (0, import_react.useState)(false);
	const [publicReference, setPublicReference] = (0, import_react.useState)("");
	const [submitted, setSubmitted] = (0, import_react.useState)(false);
	const idempotencyKey = (0, import_react.useRef)(crypto.randomUUID());
	const [form, setForm] = (0, import_react.useState)({
		name: "",
		email: "",
		phone: "",
		returning: "",
		heard: "",
		age: "",
		height: "",
		weight: "",
		eventType: "",
		eventDate: "",
		notes: "",
		privacy: false
	});
	const selectedService = services.find((service) => service.id === serviceId) ?? services[1];
	const visibleServices = services.filter((service) => service.audience === audience);
	const slots = slotsByDate[selectedDate] ?? [];
	(0, import_react.useEffect)(() => {
		fetch("/api/services", { cache: "no-store" }).then(async (response) => {
			if (!response.ok) throw new Error();
			const payload = await response.json();
			setServices(servicePresentation.map((presentation) => {
				const stored = payload.data.services.find((item) => item.code === presentation.id);
				return stored ? {
					...presentation,
					name: stored.name,
					duration: stored.durationMinutes
				} : presentation;
			}));
		}).catch(() => setBookingError("Services could not be refreshed. Please try again."));
	}, []);
	(0, import_react.useEffect)(() => {
		const controller = new AbortController();
		const from = dateKeyInBoise(today), to = dateKeyInBoise(maxDate);
		Promise.resolve().then(() => {
			setLoadingTimes(true);
			setBookingError("");
			return fetch(`/api/availability?serviceCode=${encodeURIComponent(serviceId)}&from=${from}&to=${to}`, {
				cache: "no-store",
				signal: controller.signal
			});
		}).then(async (response) => {
			const payload = await response.json();
			if (!response.ok) throw new Error(payload.error?.message || "Availability could not be loaded.");
			return payload.data;
		}).then((data) => {
			const grouped = data.slots.reduce((result, slot) => {
				const key = dateKeyInBoise(new Date(slot.startsAt));
				(result[key] ||= []).push(slot);
				return result;
			}, {});
			setSlotsByDate(grouped);
			const firstDate = Object.keys(grouped).sort()[0] || "";
			setSelectedDate((current) => grouped[current]?.length ? current : firstDate);
			setSelectedTime((current) => data.slots.some((slot) => slot.startsAt === current) ? current : grouped[firstDate]?.[0]?.startsAt || "");
		}).catch((error) => {
			if (error.name !== "AbortError") {
				setSlotsByDate({});
				setSelectedDate("");
				setSelectedTime("");
				setBookingError(error.message);
			}
		}).finally(() => setLoadingTimes(false));
		return () => controller.abort();
	}, [
		serviceId,
		today,
		maxDate
	]);
	const calendarDays = (0, import_react.useMemo)(() => {
		const year = month.getFullYear();
		const monthIndex = month.getMonth();
		const firstDay = new Date(year, monthIndex, 1).getDay();
		const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
		const previousMonthDays = new Date(year, monthIndex, 0).getDate();
		return Array.from({ length: 42 }, (_, index) => {
			const dayOffset = index - firstDay + 1;
			let date;
			let outside = false;
			if (dayOffset < 1) {
				date = new Date(year, monthIndex - 1, previousMonthDays + dayOffset);
				outside = true;
			} else if (dayOffset > daysInMonth) {
				date = new Date(year, monthIndex + 1, dayOffset - daysInMonth);
				outside = true;
			} else date = new Date(year, monthIndex, dayOffset);
			const disabled = outside || !slotsByDate[keyForDate(date)]?.length;
			return {
				date,
				outside,
				disabled,
				key: keyForDate(date)
			};
		});
	}, [month, slotsByDate]);
	function chooseService(id) {
		if (!services.find((service) => service.id === id)) return;
		setServiceId(id);
		setSelectedDate("");
		setSelectedTime("");
	}
	function updateField(name, value) {
		setForm((current) => ({
			...current,
			[name]: value
		}));
	}
	async function submitRequest() {
		if (submitting) return;
		setSubmitting(true);
		setBookingError("");
		const fit = [form.height && `Height: ${form.height}`, form.weight && `Weight: ${form.weight} lbs`].filter(Boolean).join("; ");
		try {
			const response = await fetch("/api/bookings", {
				method: "POST",
				headers: {
					"content-type": "application/json",
					"idempotency-key": idempotencyKey.current
				},
				body: JSON.stringify({
					serviceCode: serviceId,
					requestedStartAt: selectedTime,
					client: {
						fullName: form.name,
						email: form.email,
						phone: form.phone
					},
					returningClient: form.returning === "Yes",
					howHeard: form.returning === "Yes" ? null : form.heard,
					ageRange: selectedService.needsAge ? form.age === "Under 40" ? "under_40" : form.age === "40 or older" ? "40_plus" : "manual_review" : null,
					eventType: selectedService.isEvent ? form.eventType : null,
					eventDate: selectedService.isEvent ? form.eventDate : null,
					bookingNotes: [fit, form.notes].filter(Boolean).join("\n") || null,
					privacy: {
						policyVersion: "2026-07-13",
						acknowledged: form.privacy
					}
				})
			});
			const payload = await response.json();
			if (!response.ok) throw new Error(payload.error?.message || "Your request could not be submitted.");
			setPublicReference(payload.data.publicReference);
			setSubmitted(true);
		} catch (error) {
			setBookingError(error instanceof Error ? error.message : "Your request could not be submitted.");
		} finally {
			setSubmitting(false);
		}
	}
	function canContinue() {
		if (step === 1) return Boolean(serviceId);
		if (step === 2) return Boolean(selectedDate && selectedTime);
		if (step === 3) {
			const conditional = selectedService.needsAge ? Boolean(form.age) : selectedService.isEvent ? Boolean(form.eventType && form.eventDate) : true;
			return Boolean(form.name && form.email && form.phone && form.returning && (form.returning === "Yes" || form.heard) && conditional && form.privacy);
		}
		return true;
	}
	if (submitted) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "site-shell",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Announcement, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "success-wrap",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "success-mark",
						children: "✓"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "eyebrow",
						children: "REQUEST RECEIVED"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", { children: [
						"Thank you, ",
						form.name.split(" ")[0] || "there",
						"."
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "success-lead",
						children: "Your appointment is pending until Kayla reviews and confirms it."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "success-card",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, {
							service: selectedService,
							selectedDate,
							selectedTime,
							compact: true
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "request-reference",
						children: ["Request reference: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: publicReference })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "next-steps",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "1" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Kayla reviews your request" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"Your selected time is held while it is pending."
							] })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "2" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "You receive confirmation" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"Or an alternate time if the request needs adjusting."
							] })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Complete your Style Profile" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								"Your private link arrives after the appointment is confirmed."
							] })] })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "success-actions",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "button secondary-button",
							onClick: () => {
								setSubmitted(false);
								setStep(1);
							},
							children: "Return to booking preview"
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "site-shell",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Announcement, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "booking-page",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "booking-intro",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "eyebrow",
							children: "BOOK YOUR APPOINTMENT"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: step === 1 ? "Choose the support that fits." : step === 2 ? "Let's find a time that works for you." : step === 3 ? "Tell me how to reach you." : "Review your request." }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pink-rule" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "intro-copy",
							children: [
								step === 1 && "Select the service that best matches what you need. Every appointment is complimentary and personalized.",
								step === 2 && "Choose an available date and time. Your appointment will be held as pending until I review your request.",
								step === 3 && "A few details help me confirm your request and send the correct Style Profile after approval.",
								step === 4 && "Make sure everything looks right before submitting. Your selected time will be held while I review it."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "desktop-summary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, {
								service: selectedService,
								selectedDate: step >= 2 ? selectedDate : "",
								selectedTime: step >= 2 ? selectedTime : "",
								onChange: () => setStep(1)
							})
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "booking-workspace",
					"aria-live": "polite",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Progress, { step }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mobile-summary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Summary, {
								service: selectedService,
								selectedDate: step >= 2 ? selectedDate : "",
								selectedTime: step >= 2 ? selectedTime : "",
								onChange: () => setStep(1),
								compact: true
							})
						}),
						step === 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "step-panel",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "section-heading-row",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "small-label",
									children: "STEP ONE"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Select a service" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "audience-toggle",
									"aria-label": "Styling department",
									children: ["Women", "Men"].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: audience === item ? "active" : "",
										onClick: () => {
											setAudience(item);
											chooseService(item === "Women" ? "women-everyday" : "men-everyday");
										},
										children: item
									}, item))
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "service-grid",
								children: visibleServices.map((service) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: `service-option ${serviceId === service.id ? "selected" : ""}`,
									onClick: () => chooseService(service.id),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "selection-dot" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "service-type",
											children: service.shortName
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "service-duration",
											children: [service.duration, " minutes"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "service-description",
											children: service.description
										})
									]
								}, service.id))
							})]
						}),
						step === 2 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "step-panel",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "small-label",
									children: "STEP TWO"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Select a date and time" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "calendar-layout",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "calendar-panel",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "month-control",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														"aria-label": "Previous month",
														disabled: month <= new Date(today.getFullYear(), today.getMonth(), 1),
														onClick: () => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1)),
														children: "‹"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", { children: [
														monthNames[month.getMonth()],
														" ",
														month.getFullYear()
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														"aria-label": "Next month",
														disabled: month >= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1),
														onClick: () => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1)),
														children: "›"
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "weekday-row",
												children: weekdayNames.map((day) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: day }, day))
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "calendar-grid",
												children: calendarDays.map(({ date, key, outside, disabled }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													disabled,
													className: `${outside ? "outside" : ""} ${selectedDate === key ? "selected" : ""}`,
													onClick: () => {
														setSelectedDate(key);
														setSelectedTime(slotsByDate[key]?.[0]?.startsAt || "");
													},
													"aria-label": date.toDateString(),
													children: date.getDate()
												}, key))
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "availability-note",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}), " Available Tuesday–Saturday, 24+ hours ahead"]
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "time-panel",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "Available times" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: readableDate(selectedDate) }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "time-list",
												children: loadingTimes ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "loading-times",
													children: "Checking routine availability…"
												}) : slots.length ? slots.map((slot) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													className: selectedTime === slot.startsAt ? "selected" : "",
													onClick: () => setSelectedTime(slot.startsAt),
													children: [selectedTime === slot.startsAt && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "✓" }), timeInBoise(slot.startsAt)]
												}, slot.startsAt)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "loading-times",
													children: "No routine times are available for this date."
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "time-contact",
												children: ["Don't see a time that works? ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
													href: "mailto:kayla.reynolds@macys.com?subject=Appointment%20Time%20Request",
													children: "Send me a message."
												})]
											})
										]
									})]
								})
							]
						}),
						step === 3 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "step-panel details-form",
							onSubmit: (event) => event.preventDefault(),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "small-label",
									children: "STEP THREE"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Your details" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "form-grid",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "full",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Full name *" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												value: form.name,
												onChange: (e) => updateField("name", e.target.value),
												placeholder: "First and last name"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Email address *" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "email",
											value: form.email,
											onChange: (e) => updateField("email", e.target.value),
											placeholder: "you@example.com"
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Phone number *" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "tel",
											value: form.phone,
											onChange: (e) => updateField("phone", e.target.value),
											placeholder: "(208) 555-0123"
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: `profile-details-row full ${selectedService.needsAge ? "with-age" : ""}`,
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
													className: "choice-field detail-group",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "Have we worked together before? *" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: ["Yes", "No"].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														className: form.returning === value ? "selected" : "",
														onClick: () => updateField("returning", value),
														children: value
													}, value)) })]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
													className: "measurements-group detail-group",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "Height / Weight" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "measurement-inputs",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "sr-only",
																children: "Height"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
																"aria-label": "Height",
																value: form.height,
																onChange: (e) => updateField("height", e.target.value)
															})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "sr-only",
																children: "Weight"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
																"aria-label": "Weight",
																inputMode: "numeric",
																value: form.weight,
																onChange: (e) => updateField("weight", e.target.value)
															})] })]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "optional-note",
															children: "Optional—you don't have to share these."
														})
													]
												}),
												selectedService.needsAge && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
													className: "choice-field detail-group age-group",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", { children: "Age Range *" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: [
														"Under 40",
														"40 or older",
														"Prefer not to answer"
													].map((value) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														className: form.age === value ? "selected" : "",
														onClick: () => updateField("age", value),
														children: value
													}, value)) })]
												})
											]
										}),
										form.returning === "No" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "full",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "How did you hear about me?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
												value: form.heard,
												onChange: (e) => updateField("heard", e.target.value),
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
														value: "",
														children: "Select one"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Instagram" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Facebook" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "In-store" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Referral" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Macy's event" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Other" })
												]
											})]
										}),
										selectedService.isEvent && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "What type of event? *" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											value: form.eventType,
											onChange: (e) => updateField("eventType", e.target.value),
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "",
													children: "Select one"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Wedding Guest" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Wedding Party" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Business Event" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Gala or Formal Event" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "School Dance" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Other" })
											]
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "When is the event? *" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "date",
											value: form.eventDate,
											onChange: (e) => updateField("eventDate", e.target.value)
										})] })] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "full",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Anything helpful for me to know?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
												value: form.notes,
												onChange: (e) => updateField("notes", e.target.value),
												placeholder: "Optional",
												rows: 3
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "privacy-check full",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "checkbox",
												checked: form.privacy,
												onChange: (e) => updateField("privacy", e.target.checked)
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["I understand my information will be used to manage and prepare for my appointment. ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
												href: "#privacy",
												children: "Privacy details"
											})] })]
										})
									]
								})
							]
						}),
						step === 4 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							className: "step-panel review-panel",
							onSubmit: (event) => {
								event.preventDefault();
								submitRequest();
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "small-label",
									children: "STEP FOUR"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "Review your request" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "review-list",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Service" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: selectedService.name }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setStep(1),
												children: "Edit"
											})
										] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Date & time" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
												readableDate(selectedDate),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
												timeInBoise(selectedTime)
											] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setStep(2),
												children: "Edit"
											})
										] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Contact" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
												form.name,
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
												form.email,
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
												form.phone
											] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setStep(3),
												children: "Edit"
											})
										] }),
										(form.height || form.weight) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Optional fit details" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [
												form.height && `Height: ${form.height}`,
												form.height && form.weight && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
												form.weight && `Weight: ${form.weight} lbs`
											] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setStep(3),
												children: "Edit"
											})
										] }),
										selectedService.needsAge && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Style Profile routing" }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: form.age }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setStep(3),
												children: "Edit"
											})
										] })
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pending-callout",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "i" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "This is an appointment request." }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
										"Your selected time will be held while Kayla reviews it. You will receive a confirmation or an alternate-time option."
									] })]
								})
							]
						}),
						bookingError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "booking-error",
							role: "alert",
							children: bookingError
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "workspace-actions",
							children: [step > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "text-button",
								onClick: () => setStep(step - 1),
								children: "← Back"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}), step < 4 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "button primary-button",
								disabled: !canContinue(),
								onClick: () => setStep(step + 1),
								children: "Continue"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "button primary-button",
								type: "button",
								disabled: submitting,
								onClick: submitRequest,
								children: submitting ? "Submitting…" : "Submit Request"
							})]
						})
					]
				})]
			}),
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
		"aria-label": "Site header",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "container header-inner",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					className: "site-logo",
					href: "#top",
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
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#top",
							children: "Home"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#services",
							children: "Services"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#events",
							children: "Events"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#about",
							children: "About Me"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#contact",
							children: "Contact"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					className: "button header-cta",
					href: "mailto:kayla.reynolds@macys.com?subject=Free%20Styling%20Appointment",
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
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "container footer-inner",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "footer-column footer-brand",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "footer-logo",
							href: "#top",
							"aria-label": "Style with Kayla home",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: "/images/stylewithkayla_logo.png",
								alt: "Style with Kayla"
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "footer-column footer-links",
						"aria-label": "Footer quick links",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "footer-kicker",
								children: "Quick Links"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "#services",
								children: "Services"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "#events",
								children: "Events"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "footer-link--inactive",
								"aria-disabled": "true",
								children: "Guides"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "footer-link--inactive",
								"aria-disabled": "true",
								children: "FAQ"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "#about",
								children: "About Me"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "#contact",
								children: "Contact"
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
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "footer-contact-item",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: "/images/phone.png",
										alt: ""
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "tel:+12088596427",
									children: "208-859-6427"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "footer-contact-item",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: "/images/email.png",
										alt: ""
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: "mailto:kayla.reynolds@macys.com",
									children: "kayla.reynolds@macys.com"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "footer-contact-item",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: "/images/location.png",
										alt: ""
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
									"Macy's Boise Towne Square",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
									"370 N. Milwaukee St.",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
									"Boise, ID 83704"
								] })]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "footer-column footer-social",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "footer-kicker",
								children: "Follow Along"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "footer-social-links",
								"aria-label": "Social profiles",
								children: [
									"instagram",
									"facebook",
									"pinterest",
									"linkedin"
								].map((icon) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "footer-social-icon",
									role: "img",
									"aria-label": icon[0].toUpperCase() + icon.slice(1),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: `/images/${icon}.png`,
										alt: "",
										"aria-hidden": "true"
									})
								}, icon))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								className: "button button--primary",
								href: "mailto:kayla.reynolds@macys.com?subject=Free%20Styling%20Appointment",
								children: "Book Appointment"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "container privacy-notice",
				id: "privacy",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "footer-kicker",
					children: "Privacy details"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Your information is used only to review, manage, and prepare for your styling appointment. A pending request holds the selected time until Kayla confirms, declines, releases, or replaces it. Confirmed clients receive a private Style Profile link that expires 30 days after issue. Written booking and profile history is retained for two years after the most recent completed appointment. Contact Kayla to request access, correction, or deletion." })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "container footer-bottom",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "© 2026 Style with Kayla" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": "true",
						children: "|"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Personal Stylist at Macy's" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						"aria-hidden": "true",
						children: "|"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "All Rights Reserved" })
				]
			})
		]
	});
}
function Progress({ step }) {
	const labels = [
		"Service",
		"Date & Time",
		"Your Details",
		"Review"
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "progress",
		"aria-label": `Step ${step} of 4`,
		children: labels.map((label, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: step === index + 1 ? "active" : step > index + 1 ? "complete" : "",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: step > index + 1 ? "✓" : index + 1 }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: label }),
				index < labels.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {})
			]
		}, label))
	});
}
function Summary({ service, selectedDate, selectedTime, onChange, compact = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `appointment-summary ${compact ? "compact" : ""}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "summary-icon",
				children: "⌑"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "summary-audience",
					children: service.audience.toUpperCase()
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: service.shortName }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [service.duration, " minutes · Complimentary"] }),
				selectedDate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "summary-date",
					children: [
						readableDate(selectedDate),
						" · ",
						timeInBoise(selectedTime)
					]
				})
			] }),
			onChange && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: onChange,
				children: "Change service →"
			})
		]
	});
}
function dateKeyInBoise(value) {
	const parts = new Intl.DateTimeFormat("en-CA", {
		timeZone: "America/Boise",
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).formatToParts(value);
	const part = (type) => parts.find((item) => item.type === type)?.value;
	return `${part("year")}-${part("month")}-${part("day")}`;
}
function timeInBoise(value) {
	if (!value) return "Not selected";
	return new Intl.DateTimeFormat("en-US", {
		timeZone: "America/Boise",
		hour: "numeric",
		minute: "2-digit"
	}).format(new Date(value));
}
//#endregion
export { Home as default };
