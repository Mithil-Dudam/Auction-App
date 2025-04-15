import { useEffect, useState } from 'react'
import api from '../api';
import '../App.css'
import { useNavigate } from "react-router-dom";
import {MoveLeft} from "lucide-react"
import { useAppContext } from './AppContext';

function NewListing() {
    const navigate = useNavigate()
    const [image, setImage] = useState<File | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setImage(e.target.files[0]);
        }
    };

    const [name,setName] = useState("")
    const [description,setDescription] = useState("")
    const [startBid,setStartBid] = useState<number>(NaN)
    const [endDate,setEndDate] = useState("")
    const [error,setError] = useState<string|null>("")

    const {flag, userId, itemId, setFlag} = useAppContext();

    const AddListing = async () => {
        setError(null)
        if(name===""||description===""||endDate===""){
            setError("Must fill all fields")
            return
        }
        if(isNaN(startBid)){
            setError("Must enter valid starting bid")
            return
        }
        if (!image) {
            setError("Must upload an image")    
            return
        };

        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);
        formData.append("starting_bid", startBid.toString()); 
        formData.append("end_date", endDate);
        formData.append("image", image);
        try{
            const response = await api.post(`/new-listing-item?user_id=${userId}`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            })
            if(response.status===201){
                setName("")
                setDescription("")
                setStartBid(NaN)
                setEndDate("")
                setImage(null)
                navigate("/home")
            }

        }catch(error:any){
            console.error(error)
            setError("Error: Couldnt add new listing")
        }
    }

    useEffect(()=>{
        if(name!==""||description!==""||endDate!==""||image!==null){
            setError(null)
        }
    },[name,description,endDate,startBid,image])

    const GetListing = async () => {
        setError(null)
        try{
            const response = await api.get(`/item?item_id=${itemId}`)
            if(response.status===200){
                setName(response.data.name)
                setDescription(response.data.description)
                setStartBid(response.data.starting_bid)
                const utcDate = new Date(response.data.end_date);
                const localISO = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16); 
                setEndDate(localISO);
            }
        }catch(error:any){
            console.error(error)
            setError("Error: Couldnt get item details")
        }
    }

    useEffect(()=>{
        if(flag===1){
            GetListing()
        }
    },[flag])

    const ToHome = () => {
        setError(null)
        setName("")
        setDescription("")
        setStartBid(NaN)
        setEndDate("")
        setImage(null)
        setFlag(0)
        navigate("/home")
    }

    const EditListing = async () => {
        setError(null)
        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);
        formData.append("starting_bid", startBid.toString()); 
        formData.append("end_date", endDate);
        if (image) {
            formData.append("image", image);
        };
        try{
            const response = await api.post(`/edit?item_id=${itemId}`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            })
            if(response.status===200){
                ToHome()
            }
        }catch(error:any){
            console.error(error)
            if(error.response){
                setError(error.response.data.detail)
            }else{
                setError("Error: Couldnt edit item")
            }
        }
    }

    return (
        <div className='min-w-screen min-h-screen flex flex-col'>
            <h1 className='text-center pt-5'><span className='font-bold border-2 text-xl rounded-full px-2 py-1'>Oh My Bids!!</span></h1>
            <div className='border my-auto mx-auto w-[35%] px-5 h-[70vh]'>
                <MoveLeft className='pt-1 cursor-pointer' onClick={ToHome}/>
                <p className='text-center pt-5 font-semibold text-lg'>{flag===0?"Add a New Listing":"Edit Listing"}</p>
                <p className='text-center text-gray-500 text-sm'>{flag===0?"Enter item details below":"Edit item details below"}</p>
                <div className='pt-10 flex justify-between'>
                    <label className='w-[50%]'>{flag===0?"Enter Item Name":"Edit Item Name"}:</label>
                    <input className='w-full border rounded px-2' type='text' value={name} onChange={(e)=>setName(e.target.value)}/>
                </div>
                <div className='pt-5 flex justify-between'>
                    <label className='w-[50%]'>{flag===0?"Enter":"Edit"} a Description:</label>
                    <input className='w-full border rounded px-2' type='text' value={description} onChange={(e)=>setDescription(e.target.value)}/>
                </div>
                <div className='pt-5 flex justify-between'>
                    <label className='w-[50%]'>Enter Starting Price:</label>
                    <input className='w-full border rounded px-2' type='number' value={startBid===0?"":startBid} onChange={(e)=>setStartBid(Number(e.target.value))} min={1} step={0.01}/>
                </div>
                <div className='pt-5 flex justify-between'>
                    <label className='w-[50%]'>{flag===0?"Select":"Edit"} Expiry Date:</label>
                    <input className='w-full border rounded px-2' type='datetime-local' value={endDate} onChange={(e)=>setEndDate(e.target.value)}/>
                </div>
                <div className='pt-5 flex justify-center'>
                    <label className='w-[50%]'>{flag===0?"Set":"Edit"} Item Picture:</label>
                    <input type="file" accept="image/*" onChange={handleImageChange} className='border'/>
                </div>
                <div className='pt-5 flex'>
                    <button className='border p-1 rounded cursor-pointer font-semibold hover:bg-black hover:text-white mx-auto' onClick={()=>{if(flag===0){AddListing()}else{EditListing()}}}>{flag===0?"Add":"Edit"} Item</button>
                </div>
                {error?<p className='pb-5 text-red-500 text-center'>{error}</p>:""}
            </div>
        </div>
    )
}

export default NewListing