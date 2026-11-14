import { AdminNavLink } from "./AdminNavLink";
import { NavLink } from "./NavLink";

// The one list of app links, shared by the desktop sidebar and the mobile menu.
export function NavList() {
  return (
    <>
      <NavLink href="/" icon="🔍">
        Discover Patrons
      </NavLink>
      <NavLink href="/saved-patrons" icon="📁">
        Saved Patrons
      </NavLink>
      <NavLink href="/settings" icon="⚙️">
        Settings
      </NavLink>
      <AdminNavLink />
    </>
  );
}
