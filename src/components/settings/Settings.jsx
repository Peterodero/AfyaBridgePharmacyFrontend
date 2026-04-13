import { useSelector, useDispatch } from "react-redux";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { setCredentials } from "../../redux/slices/authSlice";
import api from "../../api/client";
import {
  RiUserLine,
  RiShieldLine,
  RiStoreLine,
  RiSaveLine,
  RiUploadLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiEyeOffLine,
  RiLoader4Line,
  RiTimeLine,
  RiMapPinLine,
} from "react-icons/ri";

const profileSchema = Yup.object().shape({
  full_name: Yup.string().min(2, "Too short").required("Full name is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
  phone: Yup.string()
    .matches(/^\+?[0-9\s]{9,15}$/, "Invalid phone number")
    .required("Phone is required"),
});

const pharmacySchema = Yup.object().shape({
  name: Yup.string().required("Pharmacy name is required"),
  phone: Yup.string().required("Phone is required"),
  email: Yup.string().email("Invalid email").required("Email is required"),
});

function FormField({
  label,
  name,
  type = "text",
  readonly = false,
  errors,
  touched,
}) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--ab-slate-700)",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      <Field name={name}>
        {({ field }) => (
          <input
            {...field}
            type={type}
            readOnly={readonly}
            style={{
              width: "100%",
              padding: "10px 14px",
              border: `1px solid ${errors[name] && touched[name] ? "#dc2626" : "var(--ab-slate-200)"}`,
              borderRadius: 8,
              fontSize: 14,
              color: readonly ? "var(--ab-slate-400)" : "var(--ab-slate-800)",
              background: readonly ? "var(--ab-slate-50)" : "#fff",
              outline: "none",
              fontFamily: "inherit",
            }}
          />
        )}
      </Field>
      {errors[name] && touched[name] && (
        <div style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>
          {errors[name]}
        </div>
      )}
    </div>
  );
}

// Profile Tab - FIXED VERSION
function ProfileTab() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { user, token, refreshToken } = useSelector((s) => s.auth);
  const fileRef = useRef();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get("/profile").then((r) => r.data.data),
    enabled: !!token,
  });

  const updateMutation = useMutation({
    mutationFn: (values) => api.put("/profile", values),
    onSuccess: (res) => {
      const updated = res.data.data;
      dispatch(setCredentials({ user: updated, token, refreshToken }));
      queryClient.invalidateQueries(["profile"]);
      toast.success("Profile updated!");
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to update profile."),
  });

  const photoMutation = useMutation({
    mutationFn: async (file) => {
      // Upload to Cloudinary first
      const CLOUD_URL = "https://api.cloudinary.com/v1_1/daj0gmvor/auto/upload";
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", "afyabridge_pharmacy_docs");

      const res = await fetch(CLOUD_URL, { method: "POST", body: fd });
      const data = await res.json();

      if (!data.secure_url) throw new Error("Cloudinary upload failed");

      // Send URL to backend
      return api.patch("/profile/photo", { photo_url: data.secure_url });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries(["profile"]);
      dispatch(setCredentials({ user: res.data.data, token, refreshToken }));
      toast.success("Photo updated!");
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Failed to upload photo.");
    },
  });

  const removePhotoMutation = useMutation({
    mutationFn: () => api.delete("/profile/photo"),
    onSuccess: () => {
      queryClient.invalidateQueries(["profile"]);
      toast.success("Photo removed.");
    },
    onError: () => toast.error("Failed to remove photo."),
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 800 * 1024) {
      toast.error("File too large. Max 800KB.");
      return;
    }
    photoMutation.mutate(file);
  };

  const photoUrl = profile?.profile_image || profile?.photo_url || null;
  const initials = (profile?.full_name || user?.full_name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (isLoading)
    return (
      <div style={{ padding: 40, textAlign: "center" }}>Loading profile...</div>
    );

  return (
    <div className="ab-card" style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
          Profile Settings
        </div>
        <div style={{ fontSize: 13, color: "var(--ab-slate-400)" }}>
          Update your personal information.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginBottom: 28,
          paddingBottom: 28,
          borderBottom: "1px solid var(--ab-slate-100)",
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "var(--ab-blue-bg)",
            overflow: "hidden",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="avatar"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span
              style={{ fontSize: 26, fontWeight: 700, color: "var(--ab-blue)" }}
            >
              {initials}
            </span>
          )}
        </div>
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
            <input
              ref={fileRef}
              type="file"
              accept=".jpg,.jpeg,.gif,.png"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <button
              className="ab-btn-primary"
              style={{ fontSize: 13 }}
              onClick={() => fileRef.current.click()}
              disabled={photoMutation.isPending}
            >
              {photoMutation.isPending ? (
                <>
                  <RiLoader4Line size={13} /> Uploading...
                </>
              ) : (
                <>
                  <RiUploadLine size={13} /> Upload
                </>
              )}
            </button>
            {photoUrl && (
              <button
                className="ab-btn-secondary"
                style={{ fontSize: 13 }}
                onClick={() => removePhotoMutation.mutate()}
                disabled={removePhotoMutation.isPending}
              >
                <RiDeleteBinLine size={13} /> Remove
              </button>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--ab-slate-400)" }}>
            JPG, GIF or PNG. Max 800K
          </div>
        </div>
      </div>

      <Formik
        enableReinitialize
        initialValues={{
          full_name: profile?.full_name || "",
          email: profile?.email || "",
          phone: profile?.phone || "",
        }}
        validationSchema={profileSchema}
        onSubmit={(values) => updateMutation.mutate(values)}
      >
        {({ errors, touched }) => (
          <Form>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 20,
                marginBottom: 28,
              }}
            >
              <FormField
                label="Full Name"
                name="full_name"
                errors={errors}
                touched={touched}
              />
              <FormField
                label="Email"
                name="email"
                type="email"
                errors={errors}
                touched={touched}
              />
              <FormField
                label="Phone"
                name="phone"
                type="tel"
                errors={errors}
                touched={touched}
              />
            </div>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
            >
              <button
                type="submit"
                className="ab-btn-primary"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <RiLoader4Line size={14} /> Saving...
                  </>
                ) : (
                  <>
                    <RiSaveLine size={14} /> Save
                  </>
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

// Pharmacy Tab
function PharmacyTab() {
  const { token } = useSelector((s) => s.auth);
  const logoRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: pharmacy, isLoading } = useQuery({
    queryKey: ["pharmacy"],
    queryFn: () => api.get("/settings/pharmacy").then((r) => r.data.data),
    enabled: !!token,
  });

  const { data: hours = [] } = useQuery({
    queryKey: ["pharmacy-hours"],
    queryFn: () => api.get("/settings/pharmacy/hours").then((r) => r.data.data),
    enabled: !!token,
  });

  const updateMutation = useMutation({
    mutationFn: (values) => api.put("/settings/pharmacy", values),
    onSuccess: () => {
      toast.success("Pharmacy updated!");
      queryClient.invalidateQueries(["pharmacy"]);
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to update."),
  });

  const logoMutation = useMutation({
    mutationFn: async (file) => {
      const CLOUD_URL = "https://api.cloudinary.com/v1_1/daj0gmvor/auto/upload";
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", "afyabridge_pharmacy_docs");
      const res = await fetch(CLOUD_URL, { method: "POST", body: fd });
      const data = await res.json();
      if (!data.secure_url) throw new Error("Upload failed");
      return api.patch("/settings/pharmacy/logo", {
        logo_url: data.secure_url,
      });
    },
    onSuccess: () => {
      toast.success("Logo updated!");
      queryClient.invalidateQueries(["pharmacy"]);
    },
    onError: () => toast.error("Failed to upload logo."),
  });

  const hoursMutation = useMutation({
    mutationFn: (hoursData) =>
      api.put("/settings/pharmacy/hours", { hours: hoursData }),
    onSuccess: () => {
      toast.success("Hours updated!");
      queryClient.invalidateQueries(["pharmacy-hours"]);
    },
    onError: () => toast.error("Failed to update hours."),
  });

  const deliveryMutation = useMutation({
    mutationFn: (zones) =>
      api.put("/settings/pharmacy", { delivery_zones: zones }),
    onSuccess: () => {
      toast.success("Delivery zones updated!");
      queryClient.invalidateQueries(["pharmacy"]);
    },
    onError: () => toast.error("Failed to update delivery zones."),
  });

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    logoMutation.mutate(file);
  };

  const handleUploadClick = () => {
    if (logoRef.current) {
      logoRef.current.click();
    }
  };

  const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const DAY_NAMES = {
    MON: "Monday",
    TUE: "Tuesday",
    WED: "Wednesday",
    THU: "Thursday",
    FRI: "Friday",
    SAT: "Saturday",
    SUN: "Sunday",
  };

  const [localHours, setLocalHours] = useState(
    DAYS.map((day) => {
      const existing = hours.find((h) => h.day_of_week === day);
      return {
        day_of_week: day,
        open_time: existing?.open_time || "08:00",
        close_time: existing?.close_time || "20:00",
        is_closed: existing?.is_closed || false,
      };
    }),
  );

  const [zones, setZones] = useState(pharmacy?.delivery_zones || []);
  const [newZone, setNewZone] = useState("");

  if (isLoading)
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        Loading pharmacy info...
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Logo & Basic Info */}
      <div className="ab-card" style={{ padding: 28 }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
            Pharmacy Information
          </div>
          <div style={{ fontSize: 13, color: "var(--ab-slate-400)" }}>
            Update your pharmacy details.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 12,
              background: "var(--ab-slate-100)",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {pharmacy?.logo_url ? (
              <img
                src={pharmacy.logo_url}
                alt="logo"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <RiStoreLine size={32} color="var(--ab-slate-300)" />
            )}
          </div>
          <div>
            <input
              ref={logoRef}
              type="file"
              accept=".jpg,.jpeg,.png"
              style={{ display: "none" }}
              onChange={handleLogoChange}
            />
            <button
              className="ab-btn-primary"
              style={{ fontSize: 13 }}
              onClick={handleUploadClick}
              disabled={logoMutation.isPending}
            >
              {logoMutation.isPending ? (
                <>
                  <RiLoader4Line size={13} /> Uploading...
                </>
              ) : (
                <>
                  <RiUploadLine size={13} /> Upload Logo
                </>
              )}
            </button>
          </div>
        </div>

        <Formik
          enableReinitialize
          initialValues={{
            name: pharmacy?.name || "",
            phone: pharmacy?.phone || "",
            email: pharmacy?.email || "",
          }}
          validationSchema={pharmacySchema}
          onSubmit={(values) => updateMutation.mutate(values)}
        >
          {({ errors, touched }) => (
            <Form>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 20,
                  marginBottom: 20,
                }}
              >
                <FormField
                  label="Pharmacy Name"
                  name="name"
                  errors={errors}
                  touched={touched}
                />
                <FormField
                  label="Phone"
                  name="phone"
                  type="tel"
                  errors={errors}
                  touched={touched}
                />
                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  errors={errors}
                  touched={touched}
                />
                <FormField
                  label="License Number"
                  name="license_number"
                  readonly
                  errors={errors}
                  touched={touched}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  className="ab-btn-primary"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <>
                      <RiLoader4Line size={14} /> Saving...
                    </>
                  ) : (
                    <>
                      <RiSaveLine size={14} /> Save
                    </>
                  )}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>

      {/* Operating Hours */}
      <div className="ab-card" style={{ padding: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <RiTimeLine size={18} color="var(--ab-blue)" />
          <div style={{ fontSize: 16, fontWeight: 700 }}>Operating Hours</div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 12,
          }}
        >
          {localHours.map((h) => (
            <div
              key={h.day_of_week}
              style={{
                padding: 12,
                background: h.is_closed ? "var(--ab-slate-50)" : "#fff",
                border: "1px solid var(--ab-slate-200)",
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                {DAY_NAMES[h.day_of_week]}
              </div>
              {h.is_closed ? (
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ab-slate-400)",
                    textAlign: "center",
                  }}
                >
                  Closed
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <input
                    type="time"
                    value={h.open_time}
                    onChange={(e) => {
                      const updated = [...localHours];
                      const idx = updated.findIndex(
                        (x) => x.day_of_week === h.day_of_week,
                      );
                      updated[idx] = {
                        ...updated[idx],
                        open_time: e.target.value,
                      };
                      setLocalHours(updated);
                    }}
                    style={{ fontSize: 11, padding: 4, width: "100%" }}
                  />
                  <input
                    type="time"
                    value={h.close_time}
                    onChange={(e) => {
                      const updated = [...localHours];
                      const idx = updated.findIndex(
                        (x) => x.day_of_week === h.day_of_week,
                      );
                      updated[idx] = {
                        ...updated[idx],
                        close_time: e.target.value,
                      };
                      setLocalHours(updated);
                    }}
                    style={{ fontSize: 11, padding: 4, width: "100%" }}
                  />
                </div>
              )}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  marginTop: 6,
                  fontSize: 10,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={h.is_closed}
                  onChange={(e) => {
                    const updated = [...localHours];
                    const idx = updated.findIndex(
                      (x) => x.day_of_week === h.day_of_week,
                    );
                    updated[idx] = {
                      ...updated[idx],
                      is_closed: e.target.checked,
                    };
                    setLocalHours(updated);
                  }}
                />
                Closed
              </label>
            </div>
          ))}
        </div>
        <div
          style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}
        >
          <button
            className="ab-btn-primary"
            onClick={() => hoursMutation.mutate(localHours)}
            disabled={hoursMutation.isPending}
          >
            {hoursMutation.isPending ? (
              <>
                <RiLoader4Line size={14} /> Saving...
              </>
            ) : (
              <>
                <RiSaveLine size={14} /> Save Hours
              </>
            )}
          </button>
        </div>
      </div>

      {/* Delivery Zones */}
      <div className="ab-card" style={{ padding: 28 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
          }}
        >
          <RiMapPinLine size={18} color="var(--ab-blue)" />
          <div style={{ fontSize: 16, fontWeight: 700 }}>Delivery Zones</div>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {zones.map((zone, i) => (
            <span
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                background: "var(--ab-blue-bg)",
                color: "var(--ab-blue)",
                borderRadius: 20,
                fontSize: 13,
              }}
            >
              {zone}
              <button
                onClick={() => {
                  const updated = zones.filter((_, idx) => idx !== i);
                  setZones(updated);
                  deliveryMutation.mutate(updated);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  color: "inherit",
                  fontSize: 16,
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            placeholder="Add area (e.g., Westlands, Kilimani)"
            value={newZone}
            onChange={(e) => setNewZone(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newZone.trim()) {
                setZones([...zones, newZone.trim()]);
                deliveryMutation.mutate([...zones, newZone.trim()]);
                setNewZone("");
              }
            }}
            style={{
              flex: 1,
              padding: "10px 14px",
              border: "1px solid var(--ab-slate-200)",
              borderRadius: 8,
              fontSize: 14,
            }}
          />
          <button
            className="ab-btn-primary"
            onClick={() => {
              if (newZone.trim()) {
                setZones([...zones, newZone.trim()]);
                deliveryMutation.mutate([...zones, newZone.trim()]);
                setNewZone("");
              }
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// Security Tab
function SecurityTab() {
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const passwordMutation = useMutation({
    mutationFn: (values) => api.put("/change-password", values),
    onSuccess: () => toast.success("Password updated!"),
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to update password."),
  });

  return (
    <div className="ab-card" style={{ padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
          Security Settings
        </div>
        <div style={{ fontSize: 13, color: "var(--ab-slate-400)" }}>
          Change your password.
        </div>
      </div>

      <Formik
        initialValues={{
          current_password: "",
          new_password: "",
          confirm_password: "",
        }}
        validationSchema={Yup.object().shape({
          current_password: Yup.string().required("Required"),
          new_password: Yup.string().min(8, "Min 8 chars").required("Required"),
          confirm_password: Yup.string()
            .oneOf([Yup.ref("new_password")], "Must match")
            .required("Required"),
        })}
        onSubmit={(values, { resetForm }) => {
          passwordMutation.mutate(values, { onSuccess: () => resetForm() });
        }}
      >
        {({ errors, touched }) => (
          <Form>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 20,
                marginBottom: 28,
                maxWidth: 420,
              }}
            >
              {[
                {
                  label: "Current Password",
                  name: "current_password",
                  key: "current",
                },
                { label: "New Password", name: "new_password", key: "new" },
                {
                  label: "Confirm Password",
                  name: "confirm_password",
                  key: "confirm",
                },
              ].map((f) => (
                <div key={f.name}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 600,
                      marginBottom: 6,
                    }}
                  >
                    {f.label}
                  </label>
                  <div
                    style={{
                      display: "flex",
                      border: `1px solid ${errors[f.name] && touched[f.name] ? "#dc2626" : "var(--ab-slate-200)"}`,
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    <Field name={f.name}>
                      {({ field }) => (
                        <input
                          {...field}
                          type={show[f.key] ? "text" : "password"}
                          placeholder="••••••••"
                          style={{
                            flex: 1,
                            padding: "10px 14px",
                            border: "none",
                            outline: "none",
                            fontSize: 14,
                          }}
                        />
                      )}
                    </Field>
                    <button
                      type="button"
                      onClick={() =>
                        setShow((s) => ({ ...s, [f.key]: !s[f.key] }))
                      }
                      style={{
                        padding: "10px 12px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {show[f.key] ? (
                        <RiEyeOffLine size={16} />
                      ) : (
                        <RiEyeLine size={16} />
                      )}
                    </button>
                  </div>
                  {errors[f.name] && touched[f.name] && (
                    <div
                      style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}
                    >
                      {errors[f.name]}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="ab-btn-primary"
                disabled={passwordMutation.isPending}
              >
                {passwordMutation.isPending ? (
                  <>
                    <RiLoader4Line size={14} /> Updating...
                  </>
                ) : (
                  <>
                    <RiSaveLine size={14} /> Update Password
                  </>
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}

// Main Component
export default function Settings() {
  const [activeTab, setActiveTab] = useState(0);
  const TABS = [
    { label: "Profile", icon: <RiUserLine size={15} /> },
    { label: "Pharmacy", icon: <RiStoreLine size={15} /> },
    { label: "Security", icon: <RiShieldLine size={15} /> },
  ];

  return (
    <>
      <div className="ab-page-header" style={{ marginBottom: 8 }}>
        <div className="ab-page-title">
          <h1>Settings</h1>
          <p>Manage your profile and pharmacy configurations.</p>
        </div>
      </div>
      <div className="ab-tabs" style={{ marginBottom: 24 }}>
        {TABS.map((t, i) => (
          <div
            key={i}
            className={`ab-tab${activeTab === i ? " active" : ""}`}
            onClick={() => setActiveTab(i)}
          >
            {t.icon} {t.label}
          </div>
        ))}
      </div>
      {activeTab === 0 && <ProfileTab />}
      {activeTab === 1 && <PharmacyTab />}
      {activeTab === 2 && <SecurityTab />}
    </>
  );
}
