function Navbar() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-6 py-4">
      <h1 className="text-xl font-semibold text-slate-100">Event Streaming Dashboard</h1>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-md border border-slate-600 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800"
      >
        Logout
      </button>
    </header>
  );
}

export default Navbar;
