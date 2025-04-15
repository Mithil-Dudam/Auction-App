import { useEffect, useState } from 'react'
import api from '../api';
import '../App.css'
import { useAppContext } from './AppContext';
import { useNavigate } from "react-router-dom";
import { MoveLeft } from "lucide-react"
import useWebSocket from 'react-use-websocket';

const SOCKET_URL = "ws://localhost:8000/ws";

function useCountdown(endDate: string | undefined) {
    const [timeLeft, setTimeLeft] = useState('');
    useEffect(() => {
        if (!endDate) return;
        const updateCountdown = () => {
        const target = new Date(endDate).getTime();
        const now = new Date().getTime();
        const diff = target - now;
        if (diff <= 0) {
            setTimeLeft('Expired');
            return;
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        };
        updateCountdown(); 
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval); 
    }, [endDate]);
    return timeLeft;
}

function Item() {
    const navigate = useNavigate();
    const { itemId, setItemId ,userId} = useAppContext();
    const [item, setItem] = useState<{
        name: string,
        description: string,
        starting_bid: number,
        image_url: string,
        end_date: string,
        closing_bid: number,
        item_id: number
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const GetItem = async () => {
        setError(null);
        try {
            const response = await api.get(`/item?item_id=${itemId}`);
            if (response.status === 200) {
                setItem(response.data);
            }
        } catch (error: any) {
            console.error(error);
            setError("Error: Couldn't get item details");
        }
    }

    const ToHome = () => {
        setItemId(0);
        navigate("/home");
    }

    const countdown = useCountdown(item?.end_date);
    const [select,setSelect] = useState("")
    const [flip,setFlip] = useState(false)

    const Bid = async () => {
        setError(null)
        if(select===""){
            setError("Select a bid amount.")
            return
        }
        try{
            const response = await api.post(`/bid?amount=${Number(select)}&item_id=${itemId}&user_id=${userId}`)
            if(response.status===200){
                setFlip(prev=>!prev)
            }
        }catch(error:any){
            console.error(error)
            setError("Error: Couldnt place bid")
        }
    }

    useEffect(()=>{
        if(select!==""){
            setError(null)
        }
    },[select])

    useEffect(() => {
        GetItem();
    }, [flip]);

    const [price,setPrice] = useState("")
    const {lastMessage } = useWebSocket(`${SOCKET_URL}/${itemId}`, {
        shouldReconnect: () => true,
    });

    useEffect(()=>{
        if(lastMessage!==null){setPrice(lastMessage.data)}
    },[lastMessage])

    return (
        <div className=' min-h-screen flex flex-col pb-10'>
            <h1 className='text-center pt-5'><span className='font-bold border-2 text-xl rounded-full px-2 py-1'>Oh My Bids!!</span></h1>
            <div className='border my-auto mx-auto w-[95%] px-5 overflow-y-auto mt-10'>
                <MoveLeft className='pt-1 cursor-pointer' onClick={ToHome} />
                <h1 className='px-2 break-words whitespace-pre-wrap overflow-y-auto h-[2lh] font-semibold text-center pt-4'><span className='border-b'>{item?.name}</span></h1>
                <p className='text-gray-500 text-sm mt-5'>Description:</p>
                <p className='ml-2 px-2 py-1 border break-words whitespace-pre-wrap overflow-y-auto h-[5lh]'>{item?.description}</p>
                <div className='flex justify-between my-5'>
                    <div className='my-auto'>
                        <p className='text-gray-500 text-sm'>Initial Price:<span className='text-base text-black'> $ {item?.starting_bid}</span></p>
                        <p className='text-gray-500 text-sm mt-5'>Expires In:<span className='text-base text-red-500'> {countdown}</span></p>
                    </div>
                    <div>
                        <p className='text-gray-500 text-sm text-center'>Current Bid: <span className='text-base font-bold text-black'>$ {price||item?.closing_bid}</span></p>
                        <div className='flex justify-between mt-5'>
                            <button className={`border mx-1 py-1 px-4 cursor-pointer bg-lime-300 ${select==="1"?"border-4":""}`} value={"1"} onClick={(e)=>setSelect(e.currentTarget.value)}>1</button>
                            <button className={`border mx-1 py-1 px-4 cursor-pointer bg-lime-300 ${select==="5"?"border-4":""}`} value={"5"} onClick={(e)=>setSelect(e.currentTarget.value)}>5</button>
                            <button className={`border mx-1 py-1 px-3 cursor-pointer bg-lime-300 ${select==="10"?"border-4":""}`} value={"10"} onClick={(e)=>setSelect(e.currentTarget.value)}>10</button>
                            <button className={`border mx-1 py-1 px-3 cursor-pointer bg-lime-300 ${select==="25"?"border-4":""}`} value={"25"} onClick={(e)=>setSelect(e.currentTarget.value)}>25</button>
                            <button className={`border mx-1 py-1 px-3 cursor-pointer bg-lime-300 ${select==="50"?"border-4":""}`} value={"50"} onClick={(e)=>setSelect(e.currentTarget.value)}>50</button>
                            <button className={`border mx-1 py-1 px-2 cursor-pointer bg-lime-300 ${select==="100"?"border-4":""}`} value={"100"} onClick={(e)=>setSelect(e.currentTarget.value)}>100</button>
                            <button className={`border mx-1 p-1 cursor-pointer bg-lime-300 ${select==="1000"?"border-4":""}`} value={"1000"} onClick={(e)=>setSelect(e.currentTarget.value)}>1000</button>
                        </div>
                        <div className='mt-5 flex justify-center'>
                            <button className='border p-1 cursor-pointer hover:bg-black hover:text-white font-semibold' onClick={Bid}>BID Amount</button>
                        </div>
                        {error?<p className='mt-1 text-red-500 text-center'>{error}</p>:""}
                    </div>
                    <img src={`http://localhost:8000/${item?.image_url}`} alt={item?.name} className="w-40 h-40 object-cover border mx-5 my-auto rounded" />
                </div>
            </div>
        </div>
    )
}

export default Item;
