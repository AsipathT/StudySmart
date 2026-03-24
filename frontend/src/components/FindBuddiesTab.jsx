import { useMemo, useState } from "react";
import StaticTimePickerLandscape from "./StaticTimePickerLandscape";

const FindBuddiesTab = ({
  fbSearchType,
  setFbSearchType,
  fbSubject,
  setFbSubject,
  fbAvailableTime,
  setFbAvailableTime,
  fbStudents,
  fbLoading,
  fbError,
  fbHasSearched,
  fbLoadAll,
  fbSimpleSearch,
  fbAdvancedSearch,
  renderFriendButton,
  getInitials,
  buddyColors,
}) => {
  const [openTimePicker, setOpenTimePicker] = useState({ type: null }); // Track which time picker is open
  const [nameQuery, setNameQuery] = useState("");

  const normalizeAvailabilitySlot = (slot) => {
    if (!slot) return null;
    if (typeof slot === "string") return { day: slot, startTime: "", endTime: "" };

    const day =
      slot.day ??
      slot.weekday ??
      slot.dayOfWeek ??
      slot.dayName ??
      slot.day_name ??
      slot.day_of_week;
    if (typeof day !== "string" || day.trim() === "") return null;

    const startTime =
      slot.startTime ??
      slot.start ??
      slot.from ??
      slot.start_time ??
      slot.start_time_str;
    const endTime =
      slot.endTime ??
      slot.end ??
      slot.to ??
      slot.end_time ??
      slot.end_time_str;

    return {
      day: day.trim(),
      startTime: typeof startTime === "string" ? startTime : "",
      endTime: typeof endTime === "string" ? endTime : "",
    };
  };

  const formatTimeRange = (startTime, endTime) => {
    if (startTime && endTime) return `${startTime}-${endTime}`;
    if (startTime) return startTime;
    if (endTime) return endTime;
    return "";
  };

  const filteredStudents = useMemo(() => {
    const q = nameQuery.trim().toLowerCase();
    if (!q) return fbStudents;

    return (fbStudents || []).filter((s) => {
      const n = (s?.name || "").toLowerCase();
      const e = (s?.email || "").toLowerCase();
      return n.includes(q) || e.includes(q);
    });
  }, [fbStudents, nameQuery]);

  return (
    <div className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-2xl">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Find Study Buddies</h2>
            <p className="mt-1 text-sm text-gray-600">Search students by subject or availability and connect with them.</p>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <div className="w-full sm:w-72">
              <label className="block mb-1 text-xs font-semibold tracking-wide text-gray-600 uppercase">
                Search by name
              </label>
              <input
                type="text"
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                placeholder="Type a name (or email)…"
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {fbHasSearched && !fbLoading && (
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{filteredStudents.length}</span> result
                {filteredStudents.length !== 1 ? "s" : ""}
                {nameQuery.trim() ? (
                  <span className="text-gray-500"> (filtered)</span>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5">
          <div className="p-1 bg-gray-100 border border-gray-200 rounded-2xl">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                ["all", "All Students"],
                ["simple", "By Subject"],
                ["advanced", "Advanced"],
              ].map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    setFbSearchType(k);
                    if (k === "all") fbLoadAll();
                  }}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    fbSearchType === k
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-700 hover:bg-white/70"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">

      {fbSearchType === "simple" && (
        <div className="p-4 mb-6 border border-gray-200 shadow-sm bg-gray-50 rounded-2xl">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Search by subject</h3>
              <p className="mt-0.5 text-sm text-gray-600">Type a subject and find students who study it.</p>
            </div>
          </div>

          <form onSubmit={fbSimpleSearch} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                placeholder="e.g., Math, Physics"
                value={fbSubject}
                onChange={(e) => setFbSubject(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={fbLoading}
              className="px-6 py-2.5 text-sm font-semibold text-white transition bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {fbLoading ? "Searching..." : "Search"}
            </button>
          </form>
        </div>
      )}

      {fbSearchType === "advanced" && (
        <div className="p-4 mb-6 border border-gray-200 shadow-sm bg-gray-50 rounded-2xl">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Advanced search</h3>
            <p className="mt-0.5 text-sm text-gray-600">Match students by subject, days, and time range.</p>
          </div>

          <form onSubmit={fbAdvancedSearch} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                placeholder="Enter subject"
                value={fbSubject}
                onChange={(e) => setFbSubject(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Availability</label>
              <div className="p-4 space-y-4 bg-white border border-gray-200 rounded-2xl">
                <div>
                  <label className="block mb-2 text-xs font-semibold tracking-wide text-gray-600 uppercase">Days</label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {[
                      "monday",
                      "tuesday",
                      "wednesday",
                      "thursday",
                      "friday",
                      "saturday",
                      "sunday",
                    ].map((day) => (
                      <label key={day} className="flex items-center gap-2 p-2 transition border border-gray-200 cursor-pointer rounded-xl hover:border-indigo-200">
                        <input
                          type="checkbox"
                          checked={fbAvailableTime[day]}
                          onChange={() => setFbAvailableTime((p) => ({ ...p, [day]: !p[day] }))}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 text-xs font-semibold tracking-wide text-gray-600 uppercase">Time range</label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-gray-700">Start time</label>
                      <button
                        type="button"
                        onClick={() => setOpenTimePicker({ type: "start" })}
                        className="w-full px-4 py-2.5 text-sm font-semibold text-left text-gray-800 transition bg-white border border-gray-300 rounded-xl hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        {fbAvailableTime.startTime || "Select start time"}
                      </button>
                      {openTimePicker.type === "start" && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
                          <div className="relative w-full max-w-[640px] overflow-hidden bg-white shadow-2xl rounded-2xl">
                            <button
                              type="button"
                              onClick={() => setOpenTimePicker({ type: null })}
                              className="absolute z-10 flex items-center justify-center text-2xl text-gray-500 bg-white border border-gray-200 rounded-full shadow-sm w-9 h-9 top-3 right-3 hover:text-gray-700"
                            >
                              ×
                            </button>
                            <StaticTimePickerLandscape
                              value={fbAvailableTime.startTime || "09:00"}
                              onChange={(newTime) => {
                                setFbAvailableTime((p) => ({ ...p, startTime: newTime }));
                                setOpenTimePicker({ type: null });
                              }}
                              label="Select Start Time"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1.5 text-sm font-medium text-gray-700">End time</label>
                      <button
                        type="button"
                        onClick={() => setOpenTimePicker({ type: "end" })}
                        className="w-full px-4 py-2.5 text-sm font-semibold text-left text-gray-800 transition bg-white border border-gray-300 rounded-xl hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      >
                        {fbAvailableTime.endTime || "Select end time"}
                      </button>
                      {openTimePicker.type === "end" && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
                          <div className="relative w-full max-w-[640px] overflow-hidden bg-white shadow-2xl rounded-2xl">
                            <button
                              type="button"
                              onClick={() => setOpenTimePicker({ type: null })}
                              className="absolute z-10 flex items-center justify-center text-2xl text-gray-500 bg-white border border-gray-200 rounded-full shadow-sm w-9 h-9 top-3 right-3 hover:text-gray-700"
                            >
                              ×
                            </button>
                            <StaticTimePickerLandscape
                              value={fbAvailableTime.endTime || "17:00"}
                              onChange={(newTime) => {
                                setFbAvailableTime((p) => ({ ...p, endTime: newTime }));
                                setOpenTimePicker({ type: null });
                              }}
                              label="Select End Time"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={fbLoading}
              className="w-full px-6 py-2.5 text-sm font-semibold text-white transition bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:bg-gray-400"
            >
              {fbLoading ? "Searching..." : "Search with filters"}
            </button>
          </form>
        </div>
      )}

      {fbError && (
        <div className="p-4 mb-6 border border-red-200 bg-red-50 rounded-2xl">
          <p className="text-sm font-semibold text-red-800">Something went wrong</p>
          <p className="mt-1 text-sm text-red-700">{fbError}</p>
        </div>
      )}

      {fbLoading ? (
        <div className="p-8 text-center border border-gray-200 bg-gray-50 rounded-2xl">
          <div className="text-sm font-medium text-gray-700">Loading students…</div>
          <div className="mt-1 text-xs text-gray-500">Please wait a moment.</div>
        </div>
      ) : filteredStudents.length > 0 ? (
        <div>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Students</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredStudents.map((s, idx) => (
              <div
                key={s._id}
                className="flex flex-col h-full p-4 transition bg-white border border-gray-200 rounded-2xl hover:border-indigo-200 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start min-w-0 gap-3">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-2xl text-white font-bold text-sm flex-shrink-0 overflow-hidden ${
                        buddyColors[idx % buddyColors.length]
                      }`}
                    >
                      {s.profileImage ? (
                        <img
                          src={`http://localhost:5000${s.profileImage}`}
                          alt={s.name}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        getInitials(s.name)
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{s.name}</h4>
                      <p className="text-sm text-gray-500 truncate">{s.email}</p>
                      {s.degree && (
                        <p className="mt-1 text-sm text-gray-600">
                          {s.degree}
                          {s.year && ` · Year ${s.year}`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">{renderFriendButton(s._id)}</div>
                </div>

                {s.subjects?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {s.subjects.map((sub, i) => (
                      <span key={i} className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-100 rounded-full">
                        {sub}
                      </span>
                    ))}
                  </div>
                )}

                {s.availableTime && s.availableTime.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-700">
                    {(() => {
                      const slots = (s.availableTime ?? []).map(normalizeAvailabilitySlot).filter(Boolean);

                      return slots.map((slot, i) => {
                        const timeRange = formatTimeRange(slot.startTime, slot.endTime);
                        return (
                          <span
                            key={`${slot.day}-${slot.startTime}-${slot.endTime}-${i}`}
                            className="px-2.5 py-1 bg-indigo-50 border border-indigo-100 rounded-full"
                          >
                            {slot.day}
                            {timeRange ? ` ${timeRange}` : ""}
                          </span>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center border border-gray-200 bg-gray-50 rounded-2xl">
          <div className="text-sm font-semibold text-gray-800">
            {fbHasSearched
              ? nameQuery.trim()
                ? "No matches for that name"
                : "No students found"
              : "Start by choosing a search type"}
          </div>
          <div className="mt-1 text-sm text-gray-600">
            {fbHasSearched
              ? nameQuery.trim()
                ? "Try a different name (or clear the name filter)."
                : "Try a different subject or adjust your availability filters."
              : "Use the buttons above to load all students or search with filters."}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default FindBuddiesTab;
