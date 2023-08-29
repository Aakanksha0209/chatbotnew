import React, { useContext, useEffect, useState, useRef } from 'react'
import Chatleft from './Chatleft'
import Chatright from './Chatright'
import Chatstart from './Chatstart';
import { BiBot } from 'react-icons/bi';
import { VideoCallContext } from '../../contexts/VideoCallContext';
import { ChatBotContext } from '../../contexts/ChatBotContext';
import { UserContext } from '../../contexts/UserContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhoneAlt, faVideo, faComment } from '@fortawesome/free-solid-svg-icons';
import { io } from 'socket.io-client';
import addnotification from 'react-push-notification';
// import chatbotimage from '../images/chatbotimage '

import BotImg from '../../pages/images/bot.jpeg'
import './Chat.css'

import axios from 'axios';
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import Peer from 'simple-peer';
const Chatbot = (props) => {
    const { socket } = props;
    const [messages, setMessages] = useState([]);
    // const [chat , setChat] = useState[null];
    const [showActionButtons, setShowActionButtons] = useState(false);
    const hiddenFileInput = React.useRef(null);
    const [userInput, setUserInput] = useState('');
    const chatBoxRef = useRef(null);
    const [selectedFile, setselectedFile] = useState(null);
    const [currentmsg, setCurrentmsg] = useState({ chat_flag: "", msg: "", room: "", date: "", profile_image: "", username: "" });
    const user = JSON.parse(localStorage.getItem('user'));
    const { currUser, setcurrUser } = useContext(UserContext);
    const navigate = useNavigate();
    // const [socket, setSocket] = useState(props)
    // const [reviewVis, setReviewVis] = useState(0);
    const [inputFiles, setinputFiles] = useState([]);
    const [file, setFile] = useState(null);
    const [image, setImage] = useState(null);
    // const [selectedFile, setselectedFile] = useState(null);
    //chat states

    const { vis, setvis, chat, setchat, room, setRoom, disconnectVis, setdisconnectVis, support_log, setLog } = useContext(ChatBotContext);
    //video call states
    const { receivingCall, setReceivingCall, name, setName, caller, setCaller, callerSignal, setCallerSignal, setCallAccepted, stream, userVideo, connectionRef, setStream, myVideo } = useContext(VideoCallContext);
    //support Log states
    const [reviewVis, setReviewVis] = useState(0);

    const [isOpen, setIsOpen] = useState(false);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };
    const handleSend = async () => {
        let msg_data;
        if (currUser.designation == '1' || currUser.designation == '2') {
            msg_data = { ...currentmsg, username: currUser.username, name: currUser.name, date: `${new Date(Date.now()).getHours()}:${new Date(Date.now()).getMinutes()}`, profile_image: currUser.profile_image, room: room, chat_flag: '0' };
        } else {
            msg_data = { ...currentmsg, username: currUser.username, name: currUser.name, date: `${new Date(Date.now()).getHours()}:${new Date(Date.now()).getMinutes()}`, profile_image: currUser.profile_image, room: `${currUser.name}@${currUser.username}`, chat_flag: '0' };
        }
        setchat([...chat, {
            ...msg_data, chat_flag: '1'
        }]);
        setCurrentmsg({ ...currentmsg, msg: "" });
        console.log(chat);

        if (msg_data.room) {
            await socket.emit("send_message", msg_data);
        }


        if (currentmsg.msg || inputFiles.length > 0) {
            let msg_data;

            if (currUser.designation === '1' || currUser.designation === '2') {
                msg_data = {
                    ...currentmsg,
                    username: currUser.username,
                    name: currUser.name,
                    date: `${new Date(Date.now()).getHours()}:${new Date(Date.now()).getMinutes()}`,
                    profile_image: currUser.profile_image,
                    room: room,
                    chat_flag: '0',
                };
            } else {
                msg_data = {
                    ...currentmsg,
                    username: currUser.username,
                    name: currUser.name,
                    date: `${new Date(Date.now()).getHours()}:${new Date(Date.now()).getMinutes()}`,
                    profile_image: currUser.profile_image,
                    room: `${currUser.name}@${currUser.username}`,
                    chat_flag: '0',
                };
            }

            const newChatMessage = {
                ...msg_data,
                chat_flag: '1',
                files: inputFiles, // Add the uploaded files to the message
            };

            setchat([...chat, newChatMessage]);
            setCurrentmsg({ ...currentmsg, msg: '' });
            setinputFiles([]); // Clear the uploaded files

            if (msg_data.room) {
                await socket.emit('send_message', newChatMessage);
            }

            // Emit the uploaded files to the server
            if (inputFiles.length > 0) {
                const fileDataArray = inputFiles.map(file => ({
                    fileName: file.name,
                    fileData: file.data,
                }));
                socket.emit('sendFiles', fileDataArray);
            }
        }
    }

    const clickToNotify = () => {
        addnotification({
            title: 'LASH chatbot',
            message: 'Hello from LASH',
            duration: '5000',
            native: 'true'
        })
    }

    useEffect(() => {
        socket.on("fileUploadResponse", (image) => {
            const newMessages = [...messages, { type: 'image', content: image }];
            setMessages(newMessages);
        });
    }, [socket, messages]);

    const [showChatContainer, setShowChatContainer] = useState(false);

    const handleChatIconClick = () => {
        setShowChatContainer(!showChatContainer);
    };
    const handleFileChange = (e) => {
        console.log("file>>>", e.target.files[0]);
        setFile(e.target.files[0]);
    };

    const handleFileUpload = () => {
        if (inputFiles.length > 0) {
            const fileDataArray = inputFiles.map(file => ({
                fileName: file.name,
                fileData: file.data,
            }));
            socket.emit('sendFiles', fileDataArray);
        }
    };

    useEffect(() => {
        socket.on('receiveFiles', (fileDataArray) => {
            const newMessage = {
                username: 'OtherUser', // Replace with the actual sender's username
                msg: 'File shared',
                date: new Date().toLocaleTimeString(),
                files: fileDataArray,
            };
            setchat([...chat, newMessage]);
        });
    }, [socket, chat]);
    // useEffect(() => {
    //     // Connect to the Socket.io server
    //     const socket = io('http://localhost:5000');
    //     setSocket(socket);



    //     return () => {

    //         socket.disconnect();
    //     };
    // }, []);
    const handleUserInput = () => {
        const userMessage = userInput.trim();
        if (userMessage === '') return;

        setMessages((prevMessages) => [...prevMessages, { text: userMessage, isUser: true }]);
        setUserInput('');

        // Simulate bot response (Replace this with your actual chatbot logic)
        setTimeout(() => {
            setShowActionButtons(true);
            setMessages((prevMessages) => [
                ...prevMessages,
                { text: "Sorry, currently I don't have an answer for that question.", isUser: false },
            ]);
        }, 500);
        if (socket) {
            socket.emit('usermessage', userMessage);
        }
    };

    const fileData = () => {
        if (selectedFile) {
            return (
                <>
                    <h1>file details : </h1>
                    <p>File name : {selectedFile.name}</p>
                    <p>File type : {selectedFile.type}</p>
                    <p>
                        Last Modified : {" "}
                        {selectedFile.lastModifiedDate.toDateString()}
                    </p>
                </>
            );
        } else {
            return (
                <>
                    <b style={{ color: 'white' }}>Choose Before pressing upload Button</b>
                </>
            );
        }
    }

    const handleCallClick = (action) => {
        setTimeout(() => {
            setMessages((prevMessages) => [
                ...prevMessages,
                { text: `You selected: ${action}`, isUser: true },
                { text: 'Please call on this Number: ', isUser: false },
            ]);
            setShowActionButtons(false);
        }, 500)

    };

    const handleSendMessage = () => {
        if (inputFiles.length > 0) {
            setMessages([...messages, { files: [...inputFiles], isUser: true }]);
            setinputFiles([]);
        }
    }

    const handleuploadImage = (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            const newFiles = [...inputFiles];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();
                reader.onload = (e) => {
                    newFiles.push({ name: file.name, type: file.type, data: e.target.result });
                    if (i === files.length - 1) {
                        setinputFiles(newFiles);
                    }
                };
                reader.readAsDataURL(file);
            }
        }
    };
    const joinRoom = (name, username) => {
        socket.emit("join_room", { room: `${name}@${username}`, username: username });
        setRoom(`${name}@${username}`);
    }

    const handleSupport = async (support_flag) => {
        try {
            const res = await axios.post("http://localhost:5000/api/v1/support/addSupport", { support_flag: support_flag, socket_id: socket.id }, {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });
            socket.emit("supportReq");
            // console.log(res);

            if (res.status != 200) {
                alert("Please try again!");
            } else {
                setchat([...chat, { chat_flag: '0', msg: "Our Customer support will contact you shortly.", room: "", name: "Chatbot", date: ` ${new Date(Date.now()).getHours()}:${new Date(Date.now()).getMinutes()}` }])
                if (support_flag === '0') {
                    joinRoom(currUser.name, currUser.username);
                } else if (support_flag === '1') {
                    joinRoom(currUser.name, currUser.username);
                } else {
                    joinRoom(currUser.name, currUser.username);

                }
            }
        } catch (e) {
            console.log(e);
        }

    }
    const addSupportLog = async (review) => {
        try {
            const res = await axios.post("http://localhost:5000/api/v1/history/addHistory", { ...support_log, end_time: `${new Date(Date.now()).getHours()}:${new Date(Date.now()).getMinutes()}`, status: (review ? "Resolved" : "Not Resolved") }, {
                headers: {
                    Authorization: `Bearer ${user.token}`
                }
            });
        } catch (e) {
            console.log(e);
        }
    }
    const handleDisconnect = () => {
        // console.log(support_log);

        socket.emit("disconnect_support", { room: room, socket_id: socket.id });
        socket.on("logSupport", (review) => {
            addSupportLog(review)
            socket.emit("leave_room", { room: room, socket_id: socket.id })
        })
        setdisconnectVis(0);
    }
    const handleReview = (ans) => {
        socket.emit("review", { room: room, review: ans });
        setReviewVis(0);
        socket.emit("leave_room", { socket_id: socket.id, room: room });
    }

    useEffect(() => {


        socket.on("callUser", (data) => {
            // console.log("the received signal in user is", data.signal);
            setReceivingCall(true)
            setCaller(data.from)
            setName(data.name)
            setCallerSignal(data.signal)
            navigate('/videocall', { state: { id: null, designation: '0' } });
        })
    }, [])

    useEffect(() => {
        console.log("nice");
        socket.on("receive_message", (msg_data) => {
            setchat([...chat, msg_data]);
        })
    }, [chat])
    useEffect(() => {
        console.log("File send .");
        socket.on("receive_message", (file_data) => {
            setchat([...chat, file_data])
        })
    }, [chat])
    useEffect(() => {
        if (user.designation === '0') {
            socket.on("askReview", (room) => {
                setReviewVis(1);

            })
        }
    }, [])


    useEffect(() => {
        // Automatically scroll to the latest message when a new message is added
        if (chatBoxRef.current) {
            chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    }, [messages]);
    return (
        <>

            <div>
                <div className='chatbot'>
                    <img src={BotImg} className=' chatbotimage' onClick={() => {
                        setvis(!vis)
                    }} />
                    {/* <BiBot className='text-white ' size={40}></BiBot></button> */}

                </div>
                {/* <img src={chatbotimage} id="image" alt="Hello please allow javascript" onClick={handleChatIconClick}></img> */}

                <div className='  ' >
                    {vis == 1 && <div class="">

                        {/* <!-- Component Start --> */}
                        <div className="chat-container">
                            <div className=''>
                                {disconnectVis && <button className='disconnectbutton' onClick={() => {

                                    handleDisconnect();

                                }}>
                                    Disconnect

                                </button>}
                            </div>

                            <div className="chatbox">


                                {currUser.designation === '0' && <Chatstart setchat={setchat} chat={chat} username="Chatbot" />}
                                {chat.map((x) => {

                                    if (x.msg === null) {
                                        return <>

                                            <div class="flex w-full mt-5 space-x-3 max-w-xs flex-col">
                                                <p className='chatbottext'>Chatbot</p>
                                                <div>
                                                    <div class="buttonss">
                                                        <button id='0' className='buttons' onClick={(e) => {
                                                            handleSupport(e.target.id);
                                                        }}>Chat</button>
                                                        <button id='2' className='buttons' onClick={() => handleCallClick('Call')}>Call</button>
                                                        <button id='1' className='buttons' onClick={(e) => {
                                                            handleSupport(e.target.id);
                                                        }}>Video Call</button>

                                                    </div>

                                                    {messages.map((message, index) => (
                                                        <div key={index} className={`message ${message.isUser ? 'user-message' : 'bot-message'}`}
                                                        >
                                                            {message.text}
                                                            {message.text === 'Please call on this Number: ' && (
                                                                <p>
                                                                    {/* {message.text} */}
                                                                    <a href="tel:+1234567890" id='calltext'>+7719830811</a>
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                    <span class="text-xs text-gray-500 leading-none">{x.date}</span>

                                                </div>

                                            </div>


                                        </>

                                    } else {




                                        return <>

                                            {x.chat_flag === '0' ? <Chatleft msg={x.msg} date={x.date} username={x.username} file={x.file} /> : <Chatright msg={x.msg} date={x.date} username={x.username} file={x.file} />}

                                        </>
                                    }

                                })}
                                {reviewVis ?
                                    <div class="flex w-full mt-5 space-x-3 max-w-xs flex-col">
                                        <text className='questiontext'>Chatbot</text>
                                        <div>
                                            <div class="bg-gray-300 p-3 rounded-r-lg rounded-bl-lg">
                                                <p class="text-sm">Was the issue Resolved successfully By the Customer support?</p>
                                            </div>
                                            <button className='p-2 bg-blue-300 rounded m-1 hover:bg-green-700 min-w-[3rem]' onClick={() => {
                                                handleReview(1)

                                            }}>Yes</button>
                                            <button className='p-2 bg-blue-300 rounded m-1 hover:bg-green-700 min-w-[3rem]' onClick={() => {
                                                handleReview(0)

                                            }}>No</button>
                                        </div>
                                    </div> : null
                                }
                            </div>

                            <div className={`fixed-action-buttons ${showActionButtons ? 'show-buttons' : ''}`}>
                                {/* <input value={currentmsg.msg} class="items-center h-10 w-[80%]  rounded px-3 text-sm" type="text" placeholder="Type your message…" onChange={(e) => {
                                setCurrentmsg({ ...currentmsg, msg: e.target.value })
                            }} />
                            <button className='bg-white w-[30%] mt-3 text-black font-bold py-2 px-4 rounded' onClick={() => {
                                handleSend();

                            }}>Send</button> */}
                                <div className={`user-input ${showActionButtons ? 'show-buttons' : ''}`}>
                                    <input
                                        type="text"
                                        className='inputtext'
                                        placeholder="Type your message..."
                                        value={currentmsg.msg}
                                        onChange={e => setCurrentmsg({ ...currentmsg, msg: e.target.value })}
                                    />
                                    {/* {fileData()} */}
                                    <button className="send-button" onClick={() => {
                                        handleSend();
                                    }}>
                                        Send
                                    </button>
                                </div>
                                <div>
                                    <input
                                        type="file"
                                        className='input-button'
                                        ref={hiddenFileInput}
                                        // value={currentmsg.msg}
                                        // onChange={e => setCurrentmsg({ ...currentmsg, msg: e.target.value })}
                                        // multiple onChange={handleuploadImage}
                                        onChange={handleFileChange}
                                        accept='*'
                                    // style={{ display: 'value' }}
                                    />
                                    {/* {image && <img style={{ width: '100px', height: '100px' }} src={image} alt="Uploaded" />} */}
                                    <button className="upload-button" onClick={() => handleFileUpload()}>
                                        Upload!
                                    </button>
                                    {fileData()}
                                </div>
                            </div>
                        </div>
                        {/* <!-- Component End  --> */}

                    </div>}




                </div>
            </div>


        </>
    )
}

export default Chatbot