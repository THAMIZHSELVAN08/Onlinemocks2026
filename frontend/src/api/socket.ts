import { io } from 'socket.io-client';

const SOCKET_URL = 'https://mocksbackend.forese.co.in';

export const socket = io(SOCKET_URL, {
    autoConnect: false,
});
