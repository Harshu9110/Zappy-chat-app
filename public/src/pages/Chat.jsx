import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import styled from "styled-components";
import { allUsersRoute, host } from "../utils/APIRoutes";
import ChatContainer from "../components/ChatContainer";
import Contacts from "../components/Contacts";
import Welcome from "../components/Welcome";

export default function Chat() {
  const navigate = useNavigate();
  const socket = useRef();
  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(undefined);
  const [currentUser, setCurrentUser] = useState(undefined);
  const [currentUserAvatar, setCurrentUserAvatar] = useState(undefined);
  const [currentUserName, setCurrentUserName] = useState(undefined);
  const [loading, setLoading] = useState(false);

  // Check user and set currentUser
  useEffect(() => {
    const checkUser = async () => {
      if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
        navigate("/login");
      } else {
        const user = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY));
        setCurrentUser(user);
        setCurrentUserAvatar(user.avatarImage);
        setCurrentUserName(user.username);
      }
    };
    checkUser();
  }, [navigate]);

  // Set up socket connection and handle online status updates
  useEffect(() => {
    if (currentUser) {
      socket.current = io(host);
      socket.current.emit("add-user", currentUser._id);

      // Listen for online/offline status updates
      socket.current.on("user-status", (userId, status) => {
        setContacts(prevContacts =>
          prevContacts.map(contact =>
            contact._id === userId ? { ...contact, isOnline: status } : contact
          )
        );
      });
    }

    // Clean up socket connection on unmount
    return () => {
      if (socket.current) {
        socket.current.off("user-status");
        socket.current.disconnect();
      }
    };
  }, [currentUser]);

  // Fetch contacts
  useEffect(() => {
    const fetchUsers = async () => {
      if (currentUser) {
        if (currentUser.isAvatarImageSet) {
          setLoading(true);
          try {
            const { data } = await axios.get(`${allUsersRoute}/${currentUser._id}`);
            setContacts(data);
          } catch (error) {
            console.error("Error fetching users:", error);
          } finally {
            setLoading(false);
          }
        } else {
          navigate("/setAvatar");
        }
      }
    };
    fetchUsers();
  }, [currentUser, navigate]);

  // Debounced handleChatChange
  const handleChatChange = useCallback((chat) => {
    setLoading(true);
    setTimeout(() => {
      setCurrentChat(chat);
      setLoading(false);
    }, 300); // Delay for smooth transition (optional)
  }, []);

  return (
    <Container>
      <div className="container">
        <Contacts
          contacts={contacts}
          changeChat={handleChatChange}
          currentUserAvatar={currentUserAvatar}
          currentUserName={currentUserName}
        />
        {loading ? (
          <div>Loading...</div>
        ) : currentChat === undefined ? (
          <Welcome />
        ) : (
          <ChatContainer currentChat={currentChat} socket={socket} />
        )}
      </div>
    </Container>
  );
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #131324;
  overflow: hidden;
  padding: 1rem; /* Added padding for smaller screens */

  .container {
    height: 85vh;
    width: 85vw;
    background-color: #00000076;
    display: grid;
    grid-template-columns: 25% 75%;
    border-radius: 0.5rem; /* Optional: adding rounded corners for aesthetic */

    /* Tablet screens (720px to 1080px) */
    @media screen and (min-width: 720px) and (max-width: 1080px) {
      grid-template-columns: 35% 65%;
    }

    /* Mobile screens (below 720px) */
    @media screen and (max-width: 720px) {
      grid-template-columns: 1fr;
      width: 95vw; /* Increase the width for smaller screens */
      height: auto; /* Let the container adjust height on smaller screens */
    }

    /* Very small mobile screens (below 480px) */
    @media screen and (max-width: 480px) {
      width: 100vw; /* Take full width on very small screens */
      height: 90vh; /* Slightly reduce height to avoid overflow */
    }
  }
`;
