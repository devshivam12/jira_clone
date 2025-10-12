import { useSelector } from "react-redux"

export const useUserData = () => {
    const { userData, accessToken, loader } = useSelector((state) => state.auth)
    return {
        userData,
        accessToken,
        loader
    }
}