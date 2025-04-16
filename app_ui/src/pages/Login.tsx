import { useEffect, useState } from 'react'
import api from '../api';
import '../App.css'
import { useNavigate } from "react-router-dom";
import {MoveLeft} from "lucide-react"
import { useAppContext } from './AppContext';

function Login() {
    const navigate = useNavigate()

    const [email,setEmail] = useState("")
    const [password,setPassword] = useState("")
    const [username,setUsername] = useState("")
    const [flag,setFlag] = useState(0)
    const [error,setError] = useState<String|null>("")
    const [display,setDisplay] = useState(0)
    const [code,setCode] = useState("")
    const {setIsLoggedIn, setUserId} = useAppContext();

    const Login = async () => {
        setError(null)
        if(email===""||password===""){
            setError("Must Enter all fields!")
            return
        }
        try{
            const response = await api.post("/login",{email,password})
            if(response.status===200){
                setEmail("")
                setPassword("")
                setUserId(response.data.user_id)
                setIsLoggedIn(true)
                navigate("/home")
            }
        }catch(error:any){
            console.error(error)
            if(error.response){
                setError(error.response.data.detail)
            }
            else{
                setError("Error: Couldnt perform login check")
            }
        }
    }

    const Register = async () => {
        setError(null)
        if(email===""||password===""||username===""){
            setError("Must Enter all fields!")
            return
        }
        try{
            const response = await api.post("/register",{email,password,username})
            if(response.status===201){
                setEmail("")
                setPassword("")
                setUsername("")
                setFlag(0)
            }
        }catch(error:any){
            console.error(error)
            if(error.response){
                setError(error.response.data.detail)
            }
            else{
                setError("Error: Couldnt register user.")
            }
        }
    }

    const ToRegister = () => {
        setError(null)
        setEmail("")
        setPassword("")
        setFlag(1)
    }

    useEffect(()=>{
        if(email!==""||password!==""||username!==""||code!==""){
            setError(null)
        }
    },[email,password,username,code])

    const ToResetPassword = () => {
        setError(null)
        setEmail("")
        setPassword("")
        setDisplay(1)
        setFlag(0)
    }

    const SendCode = async () => {
        setError(null)
        if(email===""){
            setError("Email can't be empty")
            return
        }
        try{
            const response = await api.post(`/code?email=${email}`)
            if(response.status===200){
                setFlag(1)
            }
        }catch(error:any){
            console.error(error)
            if(error.response){setError(error.response.data.detail)}
            else{setError("Error: Couldnt send code")}
        }
    }

    const Verify = async () => {
        setError(null)
        if(code===""){
            setError("Code can't be empty")
            return
        }
        try{
            const response = await api.post(`/verify?email=${email}&code=${code}`)
            if(response.status===200){
                if(response.data.message==="Success"){
                    setFlag(2)
                    setCode("")
                }
            }
        }catch(error:any){
            console.error(error)
            if(error.response){
                setError(error.response.data.detail)
            }else{
                setError("Error: Couldnt verify code")
            }
        }
    }

    const NewPassword = async () => {
        setError(null)
        if(password===""){
            setError("Password can't be empty")
            return
        }
        try{
            const response = await api.post("/new-password",{email,password})
            if(response.status===200){
                ToLogin()
            }
        }catch(error:any){
            console.error(error)
            setError("Error: Couldnt set new password")
        }
    }

    const ToLogin = () => {
        setError(null)
        setFlag(0)
        setEmail("")
        setPassword("")
        setUsername("")
        setDisplay(0)
    } 

    const ToCodeGen = () => {
        setError(null)
        setFlag(0)
        setCode("")
    }

    return(
        <div className='w-min-screen min-h-screen flex flex-col'>
            <h1 className='text-center pt-5'><span className='font-bold border-2 text-xl rounded-full px-2 py-1'>Oh My Bids!!</span></h1>
            {display===0&&
                <div className={`border my-auto mx-auto w-[32.5%] px-5  ${flag===1?"":"h-[55vh]"}`}>
                    {flag===0?"":<MoveLeft className='pt-1 cursor-pointer' onClick={ToLogin}/>}
                    <p className='text-center pt-5 font-semibold text-lg'>{flag===1?"Welcome New User":"Login to Gain Access!"}</p>
                    <p className='text-center text-gray-500 text-sm'>Enter your details below</p>
                    <div className='pt-10 flex justify-between'>
                        <label className='w-[50%]'>Enter Email:</label>
                        <input className='w-full border rounded px-2' type='email' value={email} onChange={(e)=>setEmail(e.target.value)}/>
                    </div>
                    <div className='pt-5 flex justify-between'>
                        <label className='w-[50%]'>Enter Password:</label>
                        <input className='w-full rounded border px-2' type='password' value={password} onChange={(e)=>setPassword(e.target.value)}/>
                    </div>
                    {flag===1&&
                        <div className='pt-5 flex justify-between'>
                            <label className='w-[50%]'>Enter Username:</label>
                            <input className='w-full rounded border px-2' type='text' value={username} onChange={(e)=>setUsername(e.target.value)}/>
                        </div> 
                    }
                    {flag===0&&
                        <div className='flex '>
                            <div className='flex-grow'/>
                            <span className='hover:underline cursor-pointer text-sm pt-1 text-gray-500' onClick={ToResetPassword}>Forgot Password ?</span>
                        </div>
                    }
                    <div className='pt-5 pb-5 flex justify-center'>
                        <button className='border p-1 rounded cursor-pointer font-semibold hover:bg-black hover:text-white' onClick={()=>{if(flag===0){Login()}else{Register()}}}>{flag===1?"Register":"Login"}</button>
                    </div>
                    {flag===0&&
                        <p className='text-center'>Don't have an account? <span className='cursor-pointer hover:underline' onClick={ToRegister}>Sign Up</span></p>
                    }
                    {error?<p className='pb-5 text-red-500 text-center'>{error}</p>:""}
                </div>
            }
            {display===1&&
                <div className='border my-auto mx-auto w-[32.5%] px-5 h-[25vh]'>
                    {flag===2?"":<MoveLeft className='pt-1 cursor-pointer' onClick={()=>{if(flag===0){ToLogin()}else if(flag===1){ToCodeGen()}}}/>}
                    <div className='pt-5 flex justify-between'>
                        <label className='w-[50%]'>Enter {flag===0?"Email":flag===1?"Code":"New Password"}:</label>
                        {flag===0&&<input className='w-full border rounded px-2' type='email' value={email} onChange={(e)=>setEmail(e.target.value)}/>}
                        {flag===1&&<input className='w-full border rounded px-2' type='text' value={code} onChange={(e)=>setCode(e.target.value)} maxLength={6} minLength={6} pattern='[0-9]*'/>}
                        {flag===2&&<input className='w-full border rounded px-2' type='password' value={password} onChange={(e)=>setPassword(e.target.value)}/>}
                    </div>
                    <div className='pt-5 pb-1 flex justify-center'>
                        {flag===1&&<button className='border p-1 rounded cursor-pointer font-semibold hover:bg-black hover:text-white mr-10' onClick={SendCode}>Resend Code</button>}
                        <button className='border p-1 rounded cursor-pointer font-semibold hover:bg-black hover:text-white' onClick={()=>{if(flag===0){SendCode()}else if(flag===1){Verify()}else{NewPassword()}}}>{flag===0?"Send Code":flag===1?"Verify Code":"Set Password"}</button>
                    </div>
                    {error?<p className='pb-5 text-red-500 text-center'>{error}</p>:""}
                </div>
            }
        </div>
    )
}

export default Login
