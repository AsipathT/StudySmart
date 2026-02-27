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
}) => (
  <div className="p-6 bg-white border border-gray-200 shadow-sm rounded-2xl">
    <h2 className="mb-6 text-2xl font-bold text-gray-900">Find Study Buddies</h2>

    <div className="flex flex-wrap gap-3 mb-6">
      {[["all", "All Students"], ["simple", "Search by Subject"], ["advanced", "Advanced Search"]].map(([k, l]) => (
        <button key={k} onClick={() => { setFbSearchType(k); if (k === "all") fbLoadAll(); }}
          className={`px-4 py-2 rounded-lg font-medium transition text-sm ${fbSearchType === k ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{l}</button>
      ))}
    </div>

    {fbSearchType === "simple" && (
      <form onSubmit={fbSimpleSearch} className="flex gap-2 mb-6">
        <input type="text" placeholder="Enter subject (e.g., Math, Physics)" value={fbSubject} onChange={(e) => setFbSubject(e.target.value)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        <button type="submit" disabled={fbLoading} className="px-6 py-2 text-white transition bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">{fbLoading ? "Searching..." : "Search"}</button>
      </form>
    )}

    {fbSearchType === "advanced" && (
      <form onSubmit={fbAdvancedSearch} className="mb-6 space-y-4">
        <div><label className="block mb-2 text-sm font-medium text-gray-700">Subject</label><input type="text" placeholder="Enter subject" value={fbSubject} onChange={(e) => setFbSubject(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" /></div>
        <div><label className="block mb-2 text-sm font-medium text-gray-700">Availability</label>
          <div className="grid grid-cols-2 gap-3">
            {["weekdays", "weekend", "morning", "evening"].map((f) => (
              <label key={f} className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" checked={fbAvailableTime[f]} onChange={() => setFbAvailableTime((p) => ({ ...p, [f]: !p[f] }))} className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                <span className="text-sm text-gray-700 capitalize">{f}</span>
              </label>
            ))}
          </div>
        </div>
        <button type="submit" disabled={fbLoading} className="w-full px-6 py-2 text-white transition bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">{fbLoading ? "Searching..." : "Search with Filters"}</button>
      </form>
    )}

    {fbError && <div className="p-3 mb-4 text-red-700 border border-red-200 rounded-lg bg-red-50">{fbError}</div>}

    {fbLoading ? (
      <div className="py-8 text-center text-gray-500">Loading students...</div>
    ) : fbStudents.length > 0 ? (
      <div>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Found {fbStudents.length} student{fbStudents.length !== 1 ? "s" : ""}</h3>
        <div className="space-y-3">
          {fbStudents.map((s, idx) => (
            <div key={s._id} className="p-4 transition border border-gray-200 rounded-xl hover:border-indigo-200 hover:shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`flex items-center justify-center w-11 h-11 rounded-xl text-white font-bold text-sm flex-shrink-0 ${buddyColors[idx % buddyColors.length]}`}>{getInitials(s.name)}</div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{s.name}</h4>
                    <p className="text-sm text-gray-500">{s.email}</p>
                    {s.degree && <p className="text-sm text-gray-500">{s.degree}{s.year && ` - Year ${s.year}`}</p>}
                    {s.subjects?.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{s.subjects.map((sub, i) => <span key={i} className="px-2 py-0.5 text-xs text-indigo-700 bg-indigo-100 rounded-full">{sub}</span>)}</div>}
                    {s.availableTime && <div className="flex flex-wrap gap-1.5 mt-2 text-xs text-gray-500">
                      {s.availableTime.weekdays && <span className="px-2 py-0.5 bg-gray-100 rounded-full">📅 Weekdays</span>}
                      {s.availableTime.weekend && <span className="px-2 py-0.5 bg-gray-100 rounded-full">📅 Weekend</span>}
                      {s.availableTime.morning && <span className="px-2 py-0.5 bg-gray-100 rounded-full">🌅 Morning</span>}
                      {s.availableTime.evening && <span className="px-2 py-0.5 bg-gray-100 rounded-full">🌆 Evening</span>}
                    </div>}
                  </div>
                </div>
                <div className="flex-shrink-0 ml-3">
                  {renderFriendButton(s._id)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : (
      fbHasSearched && <div className="py-8 text-center text-gray-500">No students found. Try different search criteria.</div>
    )}
  </div>
);

export default FindBuddiesTab;
