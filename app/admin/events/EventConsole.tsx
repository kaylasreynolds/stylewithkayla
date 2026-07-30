"use client";
import Link from "next/link";import{useEffect,useRef,useState}from"react";
import { eventDateToPickerValue, formatEventSchedule, isValidEventDate, pickerValueToEventDate } from "@/lib/event-date-time";
import { buildEventPayload, defaultEventCostLabel, EventSubmissionGuard, eventImageFileError, hasEventOffer, readUploadResponse, withoutEventOffer } from "@/lib/event-editor-client";
import { formatImageBytes, optimizeEventImage } from "@/lib/event-image-optimizer";
type EventRow = {
  id: string;
  title: string;
  location: string;
  startsAt: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  timezone: string;
  status: string;
  capacity: number | null;
  confirmed_count?: number;
};

type Rsvp = {
  id: string;
  primaryGuestName: string;
  email: string;
  partySize: number;
  status: string;
  checkedInAt: string | null;
  noShowAt: string | null;
};

type ApiErrorPayload = {
  message?: string;
  fieldErrors?: Record<string, string>;
};

type ApiResponse<T> = {
  data: T;
  error?: ApiErrorPayload;
};

type EventDetailResponse = {
  event: Record<string, unknown>;
};

type EventListResponse = {
  events: EventRow[];
};

type RsvpListResponse = {
  rsvps: Rsvp[];
};

type UploadResponse = ApiResponse<{
  asset: {
    id: string;
    previewUrl: string;
    width: number;
    height: number;
    sizeBytes: number;
  };
}>;

async function api<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, init);
  const json = await response.json() as ApiResponse<T>;

  if (!response.ok) {
    throw new Error(json.error?.message ?? "Request failed");
  }

  return json.data;
}export function EventList(){const[events,setEvents]=useState<EventRow[]>([]),[error,setError]=useState('');useEffect(()=>{api<EventListResponse>("/api/admin/events").then(data=>setEvents(data.events)).catch(e=>setError(e.message))},[]);return <Shell title="Events" actions={<Link className="event-button" href="/admin/events/new">Create event</Link>}>{error&&<p className="event-alert">{error}</p>}<div className="event-grid">{events.map(e=><Link className="event-card" href={`/admin/events/${e.id}`} key={e.id}><span className={`event-status event-status--${e.status}`}>{e.status}</span><h2>{e.title}</h2><p>{formatEventSchedule(e)} · {e.location}</p><strong>{e.confirmed_count??0} / {e.capacity} attending</strong></Link>)}{!events.length&&!error&&<div className="event-empty"><h2>No events yet</h2><p>Create an event to begin collecting RSVPs.</p></div>}</div></Shell>}
const labels=["Appointment","RSVP","Drop-In","Open House","Workshop","Styling Event","Brand Event","Community Event","Limited Spots","Presell","Special Event","Custom"];
const attendance=[['appointment_required','Appointment required'],['appointment_recommended','Appointment recommended'],['general_rsvp','General RSVP'],['drop_in','Drop-in'],['open_attendance','Open attendance'],['invitation_only','Invitation only'],['interest_list','Interest list'],['information_only','Information only']];
const actions=[['registration','Event registration form'],['appointment','Appointment selection'],['interest_list','Interest-list form'],['external_url','External URL'],['email','Email'],['phone','Phone'],['information','Information-only detail view'],['none','No CTA']];
const blank:Record<string,unknown>={title:'',eventLabel:'',customLabel:'',shortDescription:'',description:'',offer:'',offerDetails:'',offerTerms:'',eventDate:'',startTime:'',endTime:'',allDay:false,timezone:'America/Boise',location:'',locationDetails:'',directionsUrl:'',attendanceType:'',capacity:null,unlimitedCapacity:false,maxGuests:0,allowGuestNames:false,registrationOpensDate:'',registrationOpensTime:'',registrationClosesDate:'',registrationClosesTime:'',allowDuplicateRegistration:false,appointmentRequired:false,appointmentRecommended:false,costType:'complimentary',costLabel:'Complimentary',ctaLabel:'',ctaAction:'',ctaUrl:'',ctaEmail:'',ctaPhone:'',sharingEnabled:true,shareMessage:'',imageAssetId:null,imageAlt:'',status:'draft'};
export function EventEditor({eventId}:{eventId?:string}){
 const[form,setForm]=useState<Record<string,unknown>>(blank),[loaded,setLoaded]=useState(!eventId),[dirty,setDirty]=useState(false),[error,setError]=useState(''),[errors,setErrors]=useState<Record<string,string>>({}),[progress,setProgress]=useState<number|null>(null),[imageStatus,setImageStatus]=useState(''),[imageSizes,setImageSizes]=useState<{original:number;optimized:number}|null>(null),[localPreview,setLocalPreview]=useState(''),[asset,setAsset]=useState<{id:string;previewUrl:string;width:number;height:number;sizeBytes:number}|null>(null),[saving,setSaving]=useState(false),[pickerDate,setPickerDate]=useState(''),[offerOpen,setOfferOpen]=useState(false);
 const pickerRef=useRef<HTMLInputElement|null>(null),costLabels=useRef<Record<string,string>>({complimentary:'Complimentary'});
 const submissionGuard=useRef<EventSubmissionGuard|null>(null);if(!submissionGuard.current)submissionGuard.current=new EventSubmissionGuard(eventId);
useEffect(() => {
  if (!eventId) return;

  api<EventDetailResponse>(
    `/api/admin/events/${eventId}`,
  )
    .then(data => {
      const e = data.event;

      setForm({
        ...blank,
        ...e,
      });
      const loadedPickerDate = eventDateToPickerValue(e.eventDate);
      if (loadedPickerDate) setPickerDate(loadedPickerDate);
      setOfferOpen(hasEventOffer(e));
      if (e.costType) costLabels.current[String(e.costType)] = String(e.costLabel ?? "");

      if (e.imageAssetId) {
        setAsset({
          id: String(e.imageAssetId),
          previewUrl: `/api/admin/events/assets/${String(e.imageAssetId)}`,
          width: Number(e.imageWidth),
          height: Number(e.imageHeight),
          sizeBytes: Number(e.imageSizeBytes),
        });
      }

      setLoaded(true);
    })
    .catch(error => {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to load event.",
      );
    });
}, [eventId]);
 useEffect(()=>{const warn=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue=''}};addEventListener('beforeunload',warn);return()=>removeEventListener('beforeunload',warn)},[dirty]);
 const set=(key:string,value:unknown)=>{setForm(f=>({...f,[key]:value}));setDirty(true);setErrors(e=>{const n={...e};delete n[key];return n})};
 const setEventDate=(value:string)=>{set("eventDate",value);const synchronized=eventDateToPickerValue(value);if(synchronized)setPickerDate(synchronized)};
 const selectPickerDate=(value:string)=>{const visible=pickerValueToEventDate(value);if(!visible)return;setPickerDate(value);set("eventDate",visible)};
 const selectCostType=(next:string)=>{const current=String(form.costType??"");if(current)costLabels.current[current]=String(form.costLabel??"");const nextLabel=costLabels.current[next]??defaultEventCostLabel(next);set("costType",next);set("costLabel",nextLabel)};
 const setCostLabel=(value:string)=>{const type=String(form.costType??"");if(type)costLabels.current[type]=value;set("costLabel",value)};
 const field=(name:string,label:string,props:React.InputHTMLAttributes<HTMLInputElement>={})=><label>{label}<input {...props} name={name} value={String(form[name]??'')} onChange={e=>set(name,props.type==='number'?(e.target.value===''?null:Number(e.target.value)):e.target.value)} aria-invalid={!!errors[name]}/>{errors[name]&&<small className="event-field-error">{errors[name]}</small>}</label>;
 const text=(name:string,label:string,rows=4,maxLength=1000)=><label>{label}<textarea name={name} rows={rows} maxLength={maxLength} value={String(form[name]??'')} onChange={e=>set(name,e.target.value)} aria-invalid={!!errors[name]}/>{errors[name]&&<small className="event-field-error">{errors[name]}</small>}</label>;
 const check=(name:string,label:string)=><label className="event-check"><input type="checkbox" checked={Boolean(form[name])} onChange={e=>set(name,e.target.checked)}/><span>{label}</span></label>;
 async function upload(file:File){setError('');setProgress(null);setImageStatus('Optimizing image…');try{const result=await optimizeEventImage(file);const fileError=eventImageFileError(result.file.size);if(fileError)throw new Error(fileError);setImageSizes({original:result.originalBytes,optimized:result.optimizedBytes});if(localPreview)URL.revokeObjectURL(localPreview);setLocalPreview(URL.createObjectURL(result.file));setImageStatus('Image optimized. Uploading…');setProgress(0);const xhr=new XMLHttpRequest(),data=new FormData();data.set('file',result.file);xhr.upload.onprogress=e=>e.lengthComputable&&setProgress(Math.round(e.loaded/e.total*100));xhr.onerror=()=>{setError('Upload failed. Check your connection and try again.');setProgress(null);setImageStatus('')};xhr.onabort=()=>{setError('The upload was cancelled. Please try again.');setProgress(null);setImageStatus('')};xhr.onload=()=>{setProgress(null);try{const uploaded=readUploadResponse(xhr.status,xhr.getResponseHeader('content-type'),xhr.responseText);setAsset(uploaded);set('imageAssetId',uploaded.id);setImageStatus('Image uploaded.')}catch(e){setError(e instanceof Error?e.message:'The image could not be uploaded. Please try again.');setImageStatus('')}};xhr.open('POST','/api/admin/events/assets');xhr.send(data)}catch(e){setImageStatus('');setProgress(null);setError(e instanceof Error?e.message:"We couldn't optimize this image. Please choose another image and try again.")}}
async function submit(publish = false) {
  const target = submissionGuard.current!.begin();
  if (!target) return;
  setSaving(true);
  setError("");
  setErrors({});

  try {
    const payload = buildEventPayload({
      ...form,
      imageAssetId: asset?.id ?? null,
    });

    const response = await fetch(
      target.url,
      {
        method: target.method,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );

    const json = await response.json() as ApiResponse<{
      event: {
        id: string;
      };
    }>;

    if (!response.ok) {
      if (json.error?.fieldErrors) {
        setErrors(json.error.fieldErrors);
      }

      throw new Error(
        json.error?.message ?? "Request failed",
      );
    }

    const id = json.data.event.id;
    submissionGuard.current!.captureEventId(id);

    setDirty(false);

    if (publish) {
      const publishResponse = await fetch(
        `/api/admin/events/${id}/publish`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: "{}",
        },
      );

      const publishJson =
        await publishResponse.json() as ApiResponse<
          Record<string, unknown>
        >;

      if (!publishResponse.ok) {
        if (publishJson.error?.fieldErrors) {
          setErrors(publishJson.error.fieldErrors);
        }

        throw new Error(
          publishJson.error?.message ??
            "Publish failed",
        );
      }
    }

    location.href = `/admin/events/${id}`;
  } catch (error) {
    submissionGuard.current!.finish();
    setError(
      error instanceof Error
        ? error.message
        : "Unable to save event.",
    );

    setSaving(false);
  }
} if(!loaded)return <Shell title="Edit event"><p role="status">Loading…</p></Shell>;
 const registration=!['drop_in','open_attendance','invitation_only','information_only',''].includes(String(form.attendanceType));const imageAlt=String(form.imageAlt??'');const share=`Look at this event happening over at Macy’s:\n\n${form.title||'[Event Title]'}\n${form.eventDate||'[MM/DD/YY]'}\n\n${form.shortDescription||'[Short Event Description]'}\n\n[Event Link]`;const checklist=[['Image',!!asset],['Image alt text',imageAlt.trim().length>=8],['Title',!!form.title],['Short description',!!form.shortDescription],['Event label',!!form.eventLabel],['Valid date',isValidEventDate(form.eventDate)],['Time or all day',!!form.allDay||!!form.startTime&&!!form.endTime],['Location',!!form.location],['Attendance type',!!form.attendanceType],['Cost',form.costType==='not_applicable'||!!form.costLabel],['CTA configuration',form.ctaAction==='none'||!!form.ctaAction&&!!form.ctaLabel]] as const;
 return <Shell title={eventId?'Edit event':'Create event'} actions={<Link href="/admin/events" className="event-button event-button--secondary">Return to Events</Link>}>
  {error&&<p className="event-alert" role="alert">{error}</p>}<form className="event-form event-editor" onSubmit={e=>{e.preventDefault();submit(false)}} noValidate>
  <fieldset><legend>1. Event Basics</legend><p className="event-section-help">Introduce the event on its public card and detail experience.</p><div className="event-form-grid">{field('title','Event title',{maxLength:160})}<label>Event label/type<select value={String(form.eventLabel)} onChange={e=>set('eventLabel',e.target.value)} aria-invalid={!!errors.eventLabel}><option value="">Choose a label</option>{labels.map(x=><option key={x}>{x}</option>)}</select>{errors.eventLabel&&<small className="event-field-error">{errors.eventLabel}</small>}</label>{form.eventLabel==='Custom'&&field('customLabel','Custom label',{maxLength:80,required:true})}<div className="event-span">{text('shortDescription','Short card description',3,320)}</div><div className="event-span">{text('description','Full event description',7,5000)}</div></div></fieldset>
  <fieldset className="event-image-field"><legend>2. Event Image</legend><p>JPG, PNG, or WebP. Images are resized without cropping and must be no more than 5 MiB after optimization.</p><p className="event-image-notice">The uploaded image is displayed in full. It is never cropped or upscaled.</p>{(localPreview||asset)&&<img src={localPreview||asset?.previewUrl} alt={imageAlt||'Selected event image preview'}/>}<div><label className="event-button event-button--secondary">{asset?'Replace image':'Upload image'}<input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={e=>e.target.files?.[0]&&upload(e.target.files[0])}/></label>{asset&&<button type="button" className="event-link-button" onClick={()=>{if(localPreview)URL.revokeObjectURL(localPreview);setLocalPreview('');setImageSizes(null);setImageStatus('');setAsset(null);set('imageAssetId',null);set('imageAlt','')}}>Remove image</button>}</div>{imageStatus&&<span aria-live="polite">{imageStatus}</span>}{imageSizes&&<p>Original: <strong>{formatImageBytes(imageSizes.original)}</strong> · Optimized: <strong>{formatImageBytes(imageSizes.optimized)}</strong></p>}{progress!==null&&<><progress value={progress} max="100"/><span aria-live="polite">Uploading: {progress}%</span></>}{asset&&<label>Meaningful alternative text<textarea value={imageAlt} onChange={e=>set('imageAlt',e.target.value)} maxLength={240} aria-invalid={!!errors.imageAlt}/><small>{imageAlt.length} / 240 characters</small>{errors.imageAlt&&<small className="event-field-error">{errors.imageAlt}</small>}</label>}</fieldset>
<fieldset>
  <legend>3. Date, Time &amp; Location</legend>

  <p className="event-section-help">
    Type the event date as MM/DD/YY or choose it from the optional calendar. Enter times manually.
    Time zone: <strong>America/Boise</strong>.
  </p>

  <div className="event-form-grid">
    <div className="event-date-control">
      <label>Event date (MM/DD/YY)
        <span className="event-date-input-row">
          <input name="eventDate" value={String(form.eventDate??"")} placeholder="09/27/26" inputMode="numeric" maxLength={8} onChange={e=>setEventDate(e.target.value)} aria-invalid={!!errors.eventDate}/>
          <button type="button" className="event-calendar-button" aria-label="Choose event date from calendar" onClick={()=>pickerRef.current?.showPicker()}><span aria-hidden="true">▣</span></button>
          <input ref={pickerRef} className="event-native-date-picker" type="date" tabIndex={-1} aria-hidden="true" value={pickerDate} onChange={e=>selectPickerDate(e.target.value)}/>
        </span>
        {errors.eventDate&&<small className="event-field-error">{errors.eventDate}</small>}
      </label>
    </div>

    {check("allDay", "All-day event")}

    {!form.allDay && (
      <>
        {field("startTime", "Start time", {
          placeholder: "6:00 PM",
          inputMode: "text",
        })}

        {field("endTime", "End time", {
          placeholder: "8:30 PM",
          inputMode: "text",
        })}
      </>
    )}

    {field("location", "Location", {
      maxLength: 300,
    })}

    {field("locationDetails", "Optional location details", {
      maxLength: 500,
    })}

    <div className="event-span">
      {field("directionsUrl", "Optional directions URL", {
        placeholder: "https://…",
        type: "url",
      })}
    </div>
  </div>
</fieldset>  <fieldset><legend>4. Attendance &amp; Registration</legend><div className="event-form-grid"><label>Attendance type<select value={String(form.attendanceType)} onChange={e=>{const v=e.target.value;set('attendanceType',v);set('appointmentRequired',v==='appointment_required');set('appointmentRecommended',v==='appointment_recommended')}}><option value="">Choose attendance</option>{attendance.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select>{errors.attendanceType&&<small className="event-field-error">{errors.attendanceType}</small>}</label>{form.attendanceType==='invitation_only'&&<p className="event-note">Invitation-only events are not generally registerable. Use the CTA to explain how invited guests respond.</p>}{registration&&<>{check('unlimitedCapacity','Unlimited capacity')}{!form.unlimitedCapacity&&field('capacity','Capacity',{type:'number',min:1,max:10000})}{field('maxGuests','Maximum guests per registration',{type:'number',min:0,max:20})}{check('allowGuestNames','Collect guest names')}{check('allowDuplicateRegistration','Allow duplicate registration')}<div className="event-window"><h3>Registration opens (optional)</h3>{field('registrationOpensDate','Date',{placeholder:'09/01/26'})}{field('registrationOpensTime','Time',{placeholder:'9:00 AM'})}</div><div className="event-window"><h3>Registration closes (optional)</h3>{field('registrationClosesDate','Date',{placeholder:'09/26/26'})}{field('registrationClosesTime','Time',{placeholder:'5:00 PM'})}</div></>}{form.attendanceType==='appointment_required'&&<p className="event-note">Guests must select an available appointment slot to complete RSVP.</p>}{form.attendanceType==='appointment_recommended'&&<p className="event-note">Guests may RSVP without choosing an appointment slot.</p>}{form.attendanceType==='interest_list'&&<p className="event-note">Submissions collect interest and do not confirm attendance.</p>}</div></fieldset>
  <fieldset><legend>5. Cost</legend><div className="event-cost-controls"><label>Cost type<select value={String(form.costType)} onChange={e=>selectCostType(e.target.value)}><option value="complimentary">Complimentary</option><option value="paid">Paid</option><option value="purchase_required">Purchase required</option><option value="free_with_rsvp">Free with RSVP</option><option value="not_applicable">Not applicable</option><option value="custom">Custom</option></select></label>{form.costType!=="not_applicable"&&<label>{["paid","custom"].includes(String(form.costType))?"Display wording":"Optional display wording override"}<input value={String(form.costLabel??"")} maxLength={120} placeholder={defaultEventCostLabel(String(form.costType))||"Example: $25 per guest"} onChange={e=>setCostLabel(e.target.value)} aria-invalid={!!errors.costLabel}/>{errors.costLabel&&<small className="event-field-error">{errors.costLabel}</small>}</label>}<p className="event-note">Use display wording such as “$25 per guest”; the current data model does not store a numeric price.</p></div></fieldset>
  <fieldset className="event-offer-section"><legend>Offer</legend><button type="button" className="event-disclosure-button" aria-expanded={offerOpen} aria-controls="event-offer-fields" onClick={()=>setOfferOpen(open=>!open)}>Add an offer or promotion <span aria-hidden="true">{offerOpen?"−":"+"}</span></button>{offerOpen&&<div id="event-offer-fields" className="event-form-grid">{field('offer','Offer label',{maxLength:180})}<div className="event-span">{text('offerDetails','Offer details',3,1000)}{text('offerTerms','Offer terms',3,1000)}</div>{hasEventOffer(form)&&<button type="button" className="event-link-button event-remove-offer" onClick={()=>{setForm(current=>withoutEventOffer(current));setDirty(true);setOfferOpen(false)}}>Remove offer</button>}</div>}</fieldset>
  <fieldset><legend>6. Call to Action</legend><div className="event-form-grid">{field('ctaLabel','CTA label',{placeholder:'Save My Spot',maxLength:100})}<label>CTA action<select value={String(form.ctaAction)} onChange={e=>set('ctaAction',e.target.value)}><option value="">Choose an action</option>{actions.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select>{errors.ctaAction&&<small className="event-field-error">{errors.ctaAction}</small>}</label>{form.ctaAction==='external_url'&&field('ctaUrl','Destination URL',{type:'url',placeholder:'https://…'})}{form.ctaAction==='email'&&field('ctaEmail','Destination email',{type:'email'})}{form.ctaAction==='phone'&&field('ctaPhone','Destination phone',{type:'tel'})}</div></fieldset>
<fieldset>
  <legend>7. Sharing</legend>

  {check("sharingEnabled", "Enable guest sharing")}

  {Boolean(form.sharingEnabled) && (
    <div className="event-form-grid">
      <div>
        <h3>Default share-message preview</h3>
        <pre className="event-share-preview">{share}</pre>
      </div>

      {text(
        "shareMessage",
        "Optional custom share-message override",
        8,
        1500,
      )}
    </div>
  )}
</fieldset>

<fieldset>
  <legend>8. Preview &amp; Publish</legend>

  <div className="event-preview-layout">
    <article className="event-public-preview">
      {asset && (
        <img
          src={asset.previewUrl}
          alt={imageAlt}
        />
      )}

      <div>
        <span className="event-status">
          {form.eventLabel === "Custom"
            ? String(form.customLabel || "Custom label")
            : String(form.eventLabel || "Event label")}
        </span>

        <h2>
          {String(form.title || "Event title")}
        </h2>

        <p>
          {formatEventSchedule(form)}
        </p>

        <p>
          {String(form.location || "Location")}
        </p>

        <p>
          {String(
            form.shortDescription ||
              "Short event description",
          )}
        </p>

        <dl>
          <dt>Attendance</dt>
          <dd>
            {attendance.find(
              option =>
                option[0] === String(form.attendanceType),
            )?.[1] || "Not selected"}
          </dd>

          {form.costType!=="not_applicable"&&<><dt>Cost</dt><dd>{String(form.costLabel || defaultEventCostLabel(String(form.costType)) || "Not set")}</dd></>}
          {hasEventOffer(form)&&<><dt>Offer</dt><dd>{String(form.offer || form.offerDetails || form.offerTerms)}</dd></>}
        </dl>

        {form.ctaAction !== "none" &&
          Boolean(form.ctaAction) && (
            <button
              type="button"
              className="event-button"
            >
              {String(form.ctaLabel || "CTA label")}
            </button>
          )}

        <small>
          {registration
            ? "Registration is collected"
            : "No general registration"}
          {" · "}
          Sharing{" "}
          {Boolean(form.sharingEnabled)
            ? "enabled"
            : "disabled"}
        </small>
      </div>
    </article>

    <div>
      <h3>Publish requirements</h3>

      <ul className="event-checklist">
        {checklist.map(([label, complete]) => (
          <li
            className={complete ? "complete" : ""}
            key={label}
          >
            <span aria-hidden="true">
              {complete ? "✓" : "○"}
            </span>

            {label}
          </li>
        ))}
      </ul>
    </div>
  </div>
</fieldset>  <div className="event-actions" aria-live="polite"><Link href="/admin/events" className="event-link-button">Return to Events</Link><button type="submit" className="event-button event-button--secondary" disabled={saving}>{eventId?(form.status==='published'?'Save Changes':'Save Draft'):'Save Draft'}</button>{form.status==='draft'&&<button type="button" className="event-button" disabled={saving} onClick={()=>submit(true)}>Publish Event</button>}{saving&&<span>Saving…</span>}</div>
  </form></Shell>
}
export function EventOverview({
  eventId,
}: {
  eventId: string;
}) {
  const [event, setEvent] = useState<EventRow | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ event: EventRow }>(
      `/api/admin/events/${eventId}`,
    )
      .then(data => {
        setEvent(data.event);
      })
      .catch(error => {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load event.",
        );
      });
  }, [eventId]);

  async function action(actionName: string) {
    try {
      await api<Record<string, unknown>>(
        `/api/admin/events/${eventId}/${actionName}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: "{}",
        },
      );

      location.reload();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update event.",
      );
    }
  }

  return (
    <Shell
      title={event?.title ?? "Event overview"}
      actions={
        <Link
          className="event-button event-button--secondary"
          href={`/admin/events/${eventId}/edit`}
        >
          Edit
        </Link>
      }
    >
      {error && (
        <p className="event-alert">
          {error}
        </p>
      )}

      {event && (
        <>
          <div className="event-hero">
            <span
              className={`event-status event-status--${event.status}`}
            >
              {event.status}
            </span>

            <p>
              {new Date(event.startsAt).toLocaleString()}
              <br />
              {event.location}
            </p>

            <p>
              <strong>Capacity:</strong>{" "}
              {event.capacity ?? "Unlimited"}
            </p>

            {event.status === "draft" && (
              <button
                className="event-button"
                onClick={() => action("publish")}
              >
                Publish event
              </button>
            )}

            {event.status !== "archived" && (
              <button
                className="event-link-button"
                onClick={() => action("archive")}
              >
                Archive
              </button>
            )}
          </div>

          <EventTabs id={eventId} />
        </>
      )}
    </Shell>
  );
}

export function RsvpTable({
  eventId,
}: {
  eventId: string;
}) {
  const [rows, setRows] = useState<Rsvp[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    api<{ rsvps: Rsvp[] }>(
      `/api/admin/events/${eventId}/rsvps${
        status ? `?status=${status}` : ""
      }`,
    ).then(data => {
      setRows(data.rsvps);
    });
  }, [eventId, status]);

  return (
    <Shell
      title="RSVPs"
      actions={
        <a
          className="event-button event-button--secondary"
          href={`/api/admin/events/${eventId}/rsvps/export`}
        >
          Export CSV
        </a>
      }
    >
      <EventTabs id={eventId} />

      <label className="event-filter">
        Status{" "}
        <select
          value={status}
          onChange={event => setStatus(event.target.value)}
        >
          <option value="">All</option>
          <option>confirmed</option>
          <option>waitlisted</option>
          <option>cancelled</option>
        </select>
      </label>

      <div className="event-table-wrap">
        <table className="event-table">
          <thead>
            <tr>
              <th>Guest</th>
              <th>Status</th>
              <th>Party</th>
              <th>Arrival</th>
            </tr>
          </thead>

          <tbody>
            {rows.map(row => (
              <tr key={row.id}>
                <td>
                  <Link
                    href={`/admin/events/${eventId}/rsvps/${row.id}`}
                  >
                    {row.primaryGuestName}
                  </Link>
                  <small>{row.email}</small>
                </td>

                <td>{row.status}</td>
                <td>{row.partySize}</td>
                <td>
                  {row.checkedInAt
                    ? "Checked in"
                    : row.noShowAt
                      ? "No show"
                      : "Pending"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}

type RsvpDetailData = Rsvp & {
  phone?: string;
  notes?: string;
  guests: {
    id: string;
    name: string;
  }[];
};

export function RsvpDetail({
  eventId,
  rsvpId,
}: {
  eventId: string;
  rsvpId: string;
}) {
  const [rsvp, setRsvp] =
    useState<RsvpDetailData | null>(null);

  useEffect(() => {
    api<{ rsvp: RsvpDetailData }>(
      `/api/admin/events/${eventId}/rsvps/${rsvpId}`,
    ).then(data => {
      setRsvp(data.rsvp);
    });
  }, [eventId, rsvpId]);

  return (
    <Shell
      title={rsvp?.primaryGuestName ?? "RSVP detail"}
    >
      <Link href={`/admin/events/${eventId}/rsvps`}>
        ← All RSVPs
      </Link>

      {rsvp && (
        <div className="event-detail">
          <p>
            <strong>{rsvp.email}</strong>
            <br />
            {rsvp.phone}
          </p>

          <dl>
            <dt>Status</dt>
            <dd>{rsvp.status}</dd>

            <dt>Party size</dt>
            <dd>{rsvp.partySize}</dd>

            <dt>Notes</dt>
            <dd>{rsvp.notes || "—"}</dd>
          </dl>

          <h2>Additional guests</h2>

          {rsvp.guests.map(guest => (
            <p key={guest.id}>
              {guest.name}
            </p>
          ))}
        </div>
      )}
    </Shell>
  );
}

type ScheduleSlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  guestName?: string;
  label?: string;
};

export function Schedule({
  eventId,
}: {
  eventId: string;
}) {
  const [slots, setSlots] =
    useState<ScheduleSlot[]>([]);

  useEffect(() => {
    api<{ slots: ScheduleSlot[] }>(
      `/api/admin/events/${eventId}/schedule`,
    ).then(data => {
      setSlots(data.slots);
    });
  }, [eventId]);

  return (
    <Shell title="Appointment schedule">
      <EventTabs id={eventId} />

      <div className="event-timeline">
        {slots.map(slot => (
          <article key={slot.id}>
            <time>
              {new Date(slot.startsAt).toLocaleTimeString(
                [],
                {
                  hour: "numeric",
                  minute: "2-digit",
                },
              )}
            </time>

            <div>
              <strong>
                {slot.guestName ??
                  slot.label ??
                  "Open appointment"}
              </strong>

              <p>
                Until{" "}
                {new Date(slot.endsAt).toLocaleTimeString(
                  [],
                  {
                    hour: "numeric",
                    minute: "2-digit",
                  },
                )}
              </p>
            </div>
          </article>
        ))}

        {!slots.length && (
          <p>
            No appointment slots have been scheduled.
          </p>
        )}
      </div>
    </Shell>
  );
}

export function CheckIn({
  eventId,
}: {
  eventId: string;
}) {
  const [rows, setRows] = useState<Rsvp[]>([]);

  const load = () =>
    api<{ rsvps: Rsvp[] }>(
      `/api/admin/events/${eventId}/rsvps?status=confirmed`,
    ).then(data => {
      setRows(data.rsvps);
    });

  useEffect(() => {
    void load();
  }, [eventId]);

  async function mark(
    rsvpId: string,
    actionName: string,
  ) {
    await api<Record<string, unknown>>(
      `/api/admin/events/${eventId}/check-ins`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          rsvpId,
          action: actionName,
        }),
      },
    );

    await load();
  }

  return (
    <Shell title="Check-in mode">
      <EventTabs id={eventId} />

      <div className="checkin-list">
        {rows.map(row => (
          <article key={row.id}>
            <div>
              <h2>{row.primaryGuestName}</h2>
              <p>Party of {row.partySize}</p>
            </div>

            <button
              className="event-button"
              onClick={() =>
                mark(row.id, "checked_in")
              }
            >
              {row.checkedInAt
                ? "Checked in ✓"
                : "Check in"}
            </button>

            <button
              className="event-link-button"
              onClick={() =>
                mark(row.id, "no_show")
              }
            >
              No show
            </button>
          </article>
        ))}
      </div>
    </Shell>
  );
}
function EventTabs({id}:{id:string}){return <nav className="event-tabs"><Link href={`/admin/events/${id}`}>Overview</Link><Link href={`/admin/events/${id}/rsvps`}>RSVPs</Link><Link href={`/admin/events/${id}/schedule`}>Schedule</Link><Link href={`/admin/events/${id}/check-in`}>Check in</Link></nav>}
function Shell({title,actions,children}:{title:string;actions?:React.ReactNode;children:React.ReactNode}){return <main className="event-admin"><header className="event-admin-header"><div><Link href="/admin/events">Events</Link><h1>{title}</h1></div>{actions}</header>{children}</main>}
