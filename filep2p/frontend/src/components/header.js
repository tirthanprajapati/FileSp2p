import React from "react";
import logo from "../logo.svg";

const Header = () => {
  return (
    <div className="header">
      <div className="logo">
      <img src={logo} alt="logo"/>
      </div>
      <div className="Login">
        <button className="LoginButton">signup/login</button>
      </div>
    </div>
  );
};

export default Header;
