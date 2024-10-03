import React, { useState, useEffect } from "react";
import axios from "axios";
import styled from "styled-components";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../assets/logo.svg";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { registerRoute } from "../utils/APIRoutes";

export default function Register() {
  const navigate = useNavigate();
  const toastOptions = {
    position: "bottom-right",
    autoClose: 8000,
    pauseOnHover: true,
    draggable: true,
    theme: "dark",
  };
  const [values, setValues] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
      navigate("/");
    }
  });

  const handleChange = (event) => {
    setValues({ ...values, [event.target.name]: event.target.value });
  };

  const handleValidation = () => {
    const { password, confirmPassword, username, email } = values;
    if (password !== confirmPassword) {
      toast.error(
        "Password and confirm password should be same.",
        toastOptions
      );
      return false;
    } else if (username.length < 3) {
      toast.error(
        "Username should be greater than 3 characters.",
        toastOptions
      );
      return false;
    } else if (password.length < 8) {
      toast.error(
        "Password should be equal or greater than 8 characters.",
        toastOptions
      );
      return false;
    } else if (email === "") {
      toast.error("Email is required.", toastOptions);
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (handleValidation()) {
      const { email, username, password } = values;
      const { data } = await axios.post(registerRoute, {
        username,
        email,
        password,
      });

      if (data.status === false) {
        toast.error(data.msg, toastOptions);
      }
      if (data.status === true) {
        localStorage.setItem(
          process.env.REACT_APP_LOCALHOST_KEY,
          JSON.stringify(data.user)
        );
        navigate("/");
      }
    }
  };

  return (
    <>
      <FormContainer>
        <form action="" onSubmit={(event) => handleSubmit(event)}>
          <div className="brand">
            <img src={Logo} alt="logo" />
            <h1>zappychat</h1>
          </div>
          <input
            type="text"
            placeholder="Username"
            name="username"
            onChange={(e) => handleChange(e)}
          />
          <input
            type="email"
            placeholder="Email"
            name="email"
            onChange={(e) => handleChange(e)}
          />
          <input
            type="password"
            placeholder="Password"
            name="password"
            onChange={(e) => handleChange(e)}
          />
          <input
            type="password"
            placeholder="Confirm Password"
            name="confirmPassword"
            onChange={(e) => handleChange(e)}
          />
          <button type="submit">Create User</button>
          <span>
            Already have an account ? <Link to="/login">Login.</Link>
          </span>
        </form>
      </FormContainer>
      <ToastContainer />
    </>
  );
}

const FormContainer = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
  align-items: center;
  background-color: #131324;
  padding: 1rem;

  .brand {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;

    img {
      height: 6rem;
      transition: height 0.3s ease;
    }

    h1 {
      color: white;
      text-transform: uppercase;
      font-size: 2.5rem;
      transition: font-size 0.3s ease;
    }

    @media screen and (max-width: 768px) {
      img {
        height: 4rem;
      }
      h1 {
        font-size: 1.5rem;
      }
    }

    @media screen and (max-width: 480px) {
      img {
        height: 3.5rem;
      }
      h1 {
        font-size: 1.25rem;
      }
    }
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    background-color: #00000076;
    border-radius: 2rem;
    padding: 3rem 5rem; /* Adjust as necessary */
    width: 100%;
    max-width: 500px;
    transition: padding 0.3s ease;

    @media screen and (max-width: 768px) {
      padding: 2.5rem 4rem;
    }

    @media screen and (max-width: 480px) {
      padding: 2rem 3rem;
    }
  }

  input {
    background-color: transparent;
    padding: 1rem;
    border: 0.1rem solid #4e0eff;
    border-radius: 0.4rem;
    color: white;
    width: 100%;
    font-size: 1.2rem;

    &:focus {
      border: 0.1rem solid #997af0;
      outline: none;
    }

    @media screen and (max-width: 480px) {
      padding: 0.8rem;
      font-size: 0.9rem;
    }
  }

  button {
    background-color: #4e0eff;
    color: white;
    padding: 1rem 2rem;
    border: none;
    font-weight: bold;
    cursor: pointer;
    border-radius: 0.4rem;
    font-size: 1.2rem;

    &:hover {
      background-color: #4e0eff;
    }

    @media screen and (max-width: 768px) {
      padding: 0.8rem 1.6rem;
      font-size: 0.9rem;
    }

    @media screen and (max-width: 480px) {
      padding: 0.6rem 1.2rem;
      font-size: 0.8rem;
    }
  }

  span {
    color: white;
    text-transform: uppercase;
    font-size: 1.2rem; 
    text-align: center; /* Center align the text */
    margin-top: 0.5rem; /* Reduced margin for better spacing */
    white-space: nowrap; /* Prevent line wrapping */

    a {
      color: #4e0eff;
      text-decoration: none;
      font-weight: bold;
    }

    @media screen and (max-width: 768px) {
      font-size: 0.9rem;
    }

    @media screen and (max-width: 480px) {
      font-size: 0.8rem;
    }
  }
`;
