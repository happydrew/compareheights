import React, { useEffect, useState } from 'react';
import { QUERY_ORDER_STATUS_URL } from 'autoform.config';

import ReportProblemIcon from '@mui/icons-material/ReportProblem'; // For error/cancelled states
import TaskAltIcon from '@mui/icons-material/TaskAlt'; // For success state (big green check)
import CircularProgress from '@mui/material/CircularProgress';

const Payment = () => {
    const [paymentStatus, setPaymentStatus] = useState<'polling' | 'success' | 'failed'>('polling');
    const [statusMessage, setStatusMessage] = useState("");
    const [countdown, setCountdown] = useState(60);

    // Effect for polling the order status
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('request_id');

        console.log("orderId is", orderId);

        if (!orderId || paymentStatus !== 'polling') {
            return;
        }

        const intervalId = setInterval(async () => {
            try {
                const response = await fetch(QUERY_ORDER_STATUS_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ order_id: orderId }),
                });

                if (response.ok) {
                    const data = await response.json();
                    const statusApi = data.status;

                    switch (statusApi) {
                        case 'complete':
                            clearInterval(intervalId);
                            setPaymentStatus('success');
                            setStatusMessage("Your credits have been recharged. Please close this page and return to the extension to continue.");
                            break;
                        case 'cancelled':
                            clearInterval(intervalId);
                            setPaymentStatus('failed');
                            setStatusMessage("Order has been cancelled.");
                            break;
                        case 'failed':
                            clearInterval(intervalId);
                            setPaymentStatus('failed');
                            setStatusMessage("Payment failed. Please try again or contact support.");
                            break;
                        case 'timeout':
                            clearInterval(intervalId);
                            setPaymentStatus('failed');
                            setStatusMessage("Order timed out. Please try again or contact support.");
                            break;
                        case 'wait_pay':
                            console.log("Order status: wait_pay. Polling again in 10s.");
                            break;
                        default:
                            clearInterval(intervalId);
                            setPaymentStatus('failed');
                            setStatusMessage(`Unknown order status (${statusApi}). Please contact support.`);
                            break;
                    }
                } else {
                    clearInterval(intervalId);
                    setPaymentStatus('failed');
                    const errorMsg = (response.status === 400 || response.status === 404)
                        ? "The corresponding order ID could not be found. Please contact support."
                        : "Internal server error. Please try again later or contact support.";
                    setStatusMessage(errorMsg);
                }
            } catch (error) {
                console.error('Error polling order status:', error);
                clearInterval(intervalId);
                setPaymentStatus('failed');
                setStatusMessage("Network request failed. Please check your connection or contact support.");
            }
        }, 10000);

        return () => clearInterval(intervalId);
    }, [paymentStatus]);

    // Effect for the countdown timer
    useEffect(() => {
        if (paymentStatus !== 'polling') return;

        const intervalId = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(intervalId);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [paymentStatus]);

    // Success State UI
    if (paymentStatus === 'success') {
        return (
            <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center justify-center p-4 md:p-8 text-center gap-4">
                <TaskAltIcon style={{ fontSize: 80, color: 'green' }} className="mb-4" />
                <h1 className="text-2xl md:text-3xl font-bold text-green-600 mb-2">Purchase Successful!</h1>
                <p className="text-gray-700 text-lg">{statusMessage}</p>
            </div>
        );
    }

    // Failed/Cancelled/Timeout State UI
    if (paymentStatus === 'failed') {
        return (
            <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center justify-center p-4 md:p-8 text-center gap-4">
                <ReportProblemIcon style={{ fontSize: 80, color: 'red' }} className="mb-4" />
                <h1 className="text-2xl md:text-3xl font-bold text-red-600 mb-2">Notice</h1>
                <p className="text-gray-700 text-lg">{statusMessage}</p>
            </div>
        );
    }

    // Polling State UI
    return (
        <div className="min-h-screen w-full bg-gray-50 flex flex-col items-center justify-center p-4 md:p-8 text-center gap-4">
            <CircularProgress sx={{ color: 'green' }} size={60} thickness={5} />
            <h1 className="text-2xl text-center font-bold text-gray-800 mb-2">Processing payment and credit recharge, please wait patiently</h1>
            <p className="text-gray-700 text-lg">It will take approximately <span className="text-green-600 font-bold text-2xl">{countdown}</span> seconds</p>
        </div>
    );
};

export default Payment; 