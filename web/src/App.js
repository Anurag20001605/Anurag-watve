import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';

function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [alarmTime, setAlarmTime] = useState('');
    const [socket, setSocket] = useState(null);
    const [currentProblem, setCurrentProblem] = useState(null);
    const [userAnswer, setUserAnswer] = useState('');

    useEffect(() => {
        const newSocket = io('http://localhost:5000');
        setSocket(newSocket);
        newSocket.on('alarm_triggered', (data) => {
            alert('Alarm triggered! Solve the math problem!');
            generateProblem();
        });
        return () => newSocket.close();
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/auth/register', {
                name,
                email,
                password,
            });
            localStorage.setItem('token', response.data.token);
            setIsLoggedIn(true);
        } catch (err) {
            alert('Registration failed: ' + err.response.data.msg);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:5000/api/auth/login', {
                email,
                password,
            });
            localStorage.setItem('token', response.data.token);
            setIsLoggedIn(true);
        } catch (err) {
            alert('Login failed: ' + err.response.data.msg);
        }
    };

    const generateProblem = () => {
        const operators = ['+', '-', '*', '/'];
        const operator = operators[Math.floor(Math.random() * operators.length)];
        const num1 = Math.floor(Math.random() * 100);
        const num2 = Math.floor(Math.random() * 100);
        let answer;
        switch (operator) {
            case '+':
                answer = num1 + num2;
                break;
            case '-':
                answer = num1 - num2;
                break;
            case '*':
                answer = num1 * num2;
                break;
            case '/':
                answer = num1 / num2;
                break;
            default:
                answer = 0;
        }
        setCurrentProblem({ num1, num2, operator, answer });
    };

    const handleSubmitAnswer = () => {
        if (currentProblem && parseInt(userAnswer) === Math.floor(currentProblem.answer)) {
            alert('Correct! Alarm stopped!');
            socket.emit('problem_solved', { alarmId: 'current' });
            setCurrentProblem(null);
            setUserAnswer('');
        } else {
            alert('Wrong answer! Try again!');
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="container">
                <div className="auth-form">
                    <h1>Alarmath</h1>
                    <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button onClick={handleRegister}>Register</button>
                    <button onClick={handleLogin}>Login</button>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <h1>Alarmath Dashboard</h1>
            {!currentProblem ? (
                <div className="alarm-setup">
                    <input type="time" value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)} />
                    <button onClick={() => socket.emit('set_alarm', { alarmId: 'new', time: alarmTime })}>Set Alarm</button>
                </div>
            ) : (
                <div className="math-problem">
                    <h2>{currentProblem.num1} {currentProblem.operator} {currentProblem.num2} = ?</h2>
                    <input type="number" placeholder="Your answer" value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} />
                    <button onClick={handleSubmitAnswer}>Submit</button>
                </div>
            )}
        </div>
    );
}

export default App;