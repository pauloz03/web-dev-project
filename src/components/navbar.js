import { NavLink } from "react-router-dom"
import '../App.css' 

export default function Navbar() {
  return (
    <header className="navbar">
      <nav className="navbar-nav">
        <ul className="navbar-links">
        <li>
            <NavLink
                to= "/"
                className={({ isActive }) => isActive ? 'active-link' : ''}
            >
                HOME
            </NavLink>
        </li>
          <li>
            <NavLink
              to="/about"
              className={({ isActive }) => isActive ? 'active-link' : ''}
            >
              ABOUT
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/contactus"
              className={({ isActive }) => isActive ? 'active-link' : ''}
            >
                CONTACT US
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  )
}

