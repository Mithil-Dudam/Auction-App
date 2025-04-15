import '../App.css'
import { useNavigate } from "react-router-dom";

function PageNotFound() {

    const navigate = useNavigate();

    return(
        <div>
            <p className='flex justify-center mt-20 font-bold'>Whoops! Page not found!</p>
            <p className='text-center mt-5'>Back to <span className='underline cursor-pointer font-semibold' onClick={()=>navigate("/home")}>Home</span></p>
        </div>
    )
}

export default PageNotFound