"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !jobDescription) {
      setError("Please provide both a resume file and a job description.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("resume", file);
    formData.append("job_description", jobDescription);

    try {
      const response = await fetch("http://localhost:8000/api/evaluate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to evaluate the resume. Make sure the backend is running.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 lg:p-24 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-4">
            AI Resume Screener
          </h1>
          <p className="text-slate-400 text-lg">
            Optimize your resume for Applicant Tracking Systems using AI.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <section className="glass-card p-8 rounded-2xl">
            <h2 className="text-2xl font-bold mb-6 text-white border-b border-slate-700 pb-2">
              Evaluate Resume
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Upload Resume (PDF/DOCX)
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Job Description
                </label>
                <textarea
                  rows={6}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Evaluating via AI...
                  </span>
                ) : (
                  "Analyze Resume"
                )}
              </button>
            </form>
          </section>

          {/* Results Section */}
          <section className="glass-card p-8 rounded-2xl flex flex-col h-full">
            <h2 className="text-2xl font-bold mb-6 text-white border-b border-slate-700 pb-2">
              Analysis Results
            </h2>
            
            {result ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Score Circular Indicator */}
                <div className="flex flex-col items-center mb-8">
                  <div className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl font-extrabold border-8 shadow-xl
                    ${result.score >= 80 ? "border-emerald-500 text-emerald-400" : result.score >= 50 ? "border-amber-500 text-amber-400" : "border-red-500 text-red-400"}
                  `}>
                    {result.score}%
                  </div>
                  <p className="text-slate-400 mt-4 text-sm font-medium uppercase tracking-wider">Overall Match</p>
                </div>

                {/* Keywords Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/20">
                    <h3 className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
                      <span>✓</span> Matched Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.matched_keywords.length > 0 ? result.matched_keywords.map((kw: string, i: number) => (
                        <span key={i} className="bg-emerald-500/20 text-emerald-300 text-xs px-2 py-1 rounded-md">
                          {kw}
                        </span>
                      )) : <span className="text-slate-500 text-sm">None found</span>}
                    </div>
                  </div>

                  <div className="bg-red-900/20 p-4 rounded-xl border border-red-500/20">
                    <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                      <span>✗</span> Missing Keywords
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {result.missing_keywords.length > 0 ? result.missing_keywords.map((kw: string, i: number) => (
                        <span key={i} className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded-md">
                          {kw}
                        </span>
                      )) : <span className="text-slate-500 text-sm">None missing!</span>}
                    </div>
                  </div>
                </div>

                {/* Suggestions */}
                <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/20 mt-4">
                  <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
                    <span>💡</span> Rewrite Suggestions
                  </h3>
                  <ul className="space-y-3">
                    {result.rewrite_suggestions.map((suggestion: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-center flex-col gap-4">
                <svg className="w-16 h-16 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                <p>Upload a resume and paste a job description<br/>to see the analysis here.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
