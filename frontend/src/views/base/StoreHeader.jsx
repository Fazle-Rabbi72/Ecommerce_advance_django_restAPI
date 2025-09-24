import React, { useEffect ,useState,useContext } from "react";
import { useAuthStore } from "../../store/auth";
import { Link ,useNavigate} from "react-router-dom";
import { CartContext } from "../plugin/Context";

const StoreHeader = () => {
  const { isLoggedIn, user, hydrateUser, loading } = useAuthStore();

  const [search, setSearch] =useState("")
  
  // Page load এ user data hydrate
  useEffect(() => {
    hydrateUser();
  }, [hydrateUser]);

  const handleSearchChange =(event)=>{
    setSearch(event.target.value)
    
  }
  const navigate= useNavigate()

  const handleSearchSubmit=()=>{
    navigate(`/search?query=${search}`)

  }

  const cartCount= useContext(CartContext)
  
  


  if (!loading)
  {
    return (
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm sticky-top">
        <div className="container">
          {/* Brand */}
          <Link className="navbar-brand fw-bold" to="/">
            <i className="fa-solid fa-store me-2"></i> MyStore
          </Link>

          {/* Mobile toggle */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            aria-controls="navbarNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Navbar content */}
          <div className="collapse navbar-collapse" id="navbarNav">
            {/* Left menu */}
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              {/* Dropdown */}
              <li className="nav-item dropdown">
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  data-bs-toggle="dropdown"
                >
                  Pages
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <a className="dropdown-item" href="#">
                      About Us
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#">
                      Services
                    </a>
                  </li>
                  <li>
                    <a className="dropdown-item" href="#">
                      FAQ
                    </a>
                  </li>
                </ul>
              </li>

              <li className="nav-item">
                <a className="nav-link" href="#">
                  Contact
                </a>
              </li>
            </ul>

            {/* Search bar */}
            <form className="d-flex mx-auto w-50" role="search">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control rounded-start-pill"
                  placeholder="Search products..."
                  aria-label="Search"
                  onChange={handleSearchChange}
                />
                <button
                  className="btn btn-warning rounded-end-pill"
                  type="button"
                  onClick={handleSearchSubmit}
                >
                  <i className="fa-solid fa-magnifying-glass"></i>
                </button>
              </div>
            </form>

            {/* Right side */}
            <div className="d-flex align-items-center gap-3">
              {/* Cart */}
              <Link to={"/cart/"} className="btn btn-outline-light position-relative">
                <i className="fa-solid fa-cart-shopping fa-lg"></i>
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {cartCount}
                </span>
              </Link>

              {/* Profile or Login */}
              {isLoggedIn ? (
                <div className="dropdown">
                  <a
                    href="#"
                    className="d-flex align-items-center text-white text-decoration-none dropdown-toggle"
                    id="userDropdown"
                    data-bs-toggle="dropdown"
                  >
                    {user?.full_name || "Profile"}
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <a className="dropdown-item" href="customer/account/">
                        My Account
                      </a>
                    </li>
                    <li>
                      <Link to='/customer/orders/' className="dropdown-item" href="#">
                        Orders
                      </Link>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <a className="dropdown-item" href="/logout">
                        Logout
                      </a>
                    </li>
                  </ul>
                </div>
              ) : (
                <a href="/login" className="btn btn-light text-primary">
                  Login
                </a>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }
};

export default StoreHeader;
