import { useEffect, useState } from 'react'
import api from '../api';
import '../App.css'
import { useAppContext } from './AppContext';
import { useNavigate } from "react-router-dom";

function Home() {

  const navigate = useNavigate()
  const { setItemId, userId, setFlag} = useAppContext();
  const [allListings,setAllListings] = useState<{name:string,description:string,starting_bid:number,image_url:string,end_date:string,closing_bid:number,item_id:number, user_id:number}[]>([])
  const [error,setError] = useState<string|null>(null)

  const AllListings = async () =>{
    setError(null)
    try{
      const response = await api.get("/all-listings")
      if(response.status===200){
        setAllListings(response.data)
      }
    }catch(error:any){
      console.error(error)
      setError("Error: Couldnt get All Listings")
    }
  }

  const MyListings = async () =>{
    setError(null)
    try{
      const response = await api.get(`/all-listings?user_id=${userId}`)
      if(response.status===200){
        setAllListings(response.data)
      }
    }catch(error:any){
      console.error(error)
      setError("Error: Couldnt get All Listings")
    }
  }

  useEffect(()=>{
    AllListings()
  },[])

  const ToItem = (item_id:number) => {
    setItemId(item_id)
    navigate("/item")
  }

  useEffect(() => {
    if (allListings.length > 0) {
      const sockets: { [key: number]: WebSocket } = {};
      allListings.forEach(item => {
        const socket = new WebSocket(`ws://localhost:8000/ws/${item.item_id}`);
        socket.onmessage = (event) => {
          const newPrice = parseFloat(event.data);
          setAllListings(prev =>
            prev.map(listing =>
              listing.item_id === item.item_id
                ? { ...listing, closing_bid: newPrice }
                : listing
            )
          );
        };
        socket.onerror = (e) => {
          console.error(`WebSocket error for item ${item.item_id}:`, e);
        };
  
        sockets[item.item_id] = socket;
      });
      return () => {
        Object.values(sockets).forEach(socket => socket.close());
      };
    }
  }, [allListings]);

  const Delete = async (item_id:number) => {
    setError(null)
    try{
      const response = await api.post(`/delete?item_id=${item_id}`)
      if(response.status===200){
        AllListings()
      }
    }catch(error:any){
      console.error(error)
      setError("Error: Couldnt Delete Item")
    }
  }

  const Edit = (item_id:number) => {
    navigate("/new-listing")
    setFlag(1)
    setItemId(item_id)
  }

  const [selected,setSelected] = useState("All")

  return (
    <div className='min-h-screen'>
      <h1 className='text-center pt-5'><span className='font-bold border-2 text-xl rounded-full px-2 py-1'>Oh My Bids!!</span></h1>
      <div className='flex justify-between mx-5 mt-10'>
        <div>
          <button className={`hover:bg-black hover:text-white font-semibold py-1 px-7 cursor-pointer bg-emerald-300 ${selected==="All"?"border-4":"border-r border-l border-t"}`} value={"All"} onClick={()=>{
            setSelected("All")
            AllListings()
          }}>All</button>
          <button className={`hover:bg-black hover:text-white font-semibold p-1 cursor-pointer bg-emerald-300 ${selected==="My Listings"?"border-4":"border-r border-l border-t"}`} value={"My Listings"} onClick={()=>{
            setSelected("My Listings")
            MyListings()
          }}>My Listings</button>
        </div>
        <button className='hover:bg-black hover:text-white font-semibold border-r border-l border-t p-1 cursor-pointer bg-emerald-300' onClick={()=>navigate("/new-listing")}>Add Listing</button>
      </div>
      <div className='border mb-10 mx-5 pb-5'>
        {allListings.length > 0 ? (
          allListings.map((item, index) => (
            <div>
              <div key={index} className='mt-5 border mx-5 hover:bg-gray-100 cursor-pointer' onClick={()=>ToItem(item.item_id)}>
                <p className='text-center text-lg font-semibold truncate mx-5'><span className='border-b'>{item.name}</span></p>
                <div className='flex justify-between w-full'>
                  <div className='mx-5 w-[75%]'>
                    <p className='text-gray-500 text-sm'>Description:</p>
                    <p className='ml-2 break-words overflow-hidden text-ellipsis line-clamp-3 whitespace-normal'>{item.description}</p>
                    <div className='flex justify-between w-full'>
                      <div>
                        <p className='text-gray-500 text-sm'>Initial Price:</p>
                        <p className='ml-2'>$ {item.starting_bid}</p>
                        <p className='text-red-500 text-sm'>Expires on:</p>
                        <p className='ml-2'>
                          {new Date(item.end_date) < new Date() ? (
                          <p className='ml-2 text-red-700 font-semibold'>Expired</p>
                            ) : (
                          <p className='ml-2'>
                            {new Date(item.end_date).toLocaleDateString('en-GB')} at {new Date(item.end_date).toLocaleTimeString('en-GB', { hour12: false })}
                          </p>
                        )}
                        </p>
                      </div>
                      <div className='my-auto mr-68 '>
                        <p className='text-gray-500 text-sm'>Current Bid: {item.closing_bid?(<span className='text-base font-bold text-black'>$ {item.closing_bid}</span>):(<span className='text-base font-bold text-black'>$ {item.starting_bid}</span>)}</p>
                        <div className='flex justify-center mt-3'>
                          <button className='p-1 border hover:bg-black hover:text-white cursor-pointer font-semibold bg-lime-300' onClick={()=>ToItem(item.item_id)}>Bid Now!</button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className=''>
                    <img src={`http://localhost:8000/${item.image_url}`} alt={item.name} className="w-40 h-40 object-cover border mx-5 mb-5 rounded" />
                  </div>
                </div>
              </div>
              {userId===item.user_id&&
                <div className='mb-5 flex justify-end mr-5 font-semibold'>
                  <div>
                    <button className='hover:bg-black hover:text-white border-l border-r border-b py-1 px-3 mr-5 bg-amber-300 cursor-pointer' onClick={()=>Edit(item.item_id)}>Edit</button>
                    <button className='hover:bg-black hover:text-white border-l-black border-r-black border-b-black p-1 bg-red-500 text-white cursor-pointer' onClick={()=>Delete(item.item_id)}>Delete</button>
                  </div>
                </div>
              }
            </div>
          ))
        ) : (
          <div>
            <p className='text-center'>No items yet</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home
