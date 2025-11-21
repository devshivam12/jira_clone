import { useSelector } from "react-redux"

export const userData = () => {
    const { userData } = useSelector((state) => state.authSlice)
    return {
        userData: userData
    }
}