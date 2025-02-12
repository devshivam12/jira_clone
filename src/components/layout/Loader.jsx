import React from 'react'
import { SiJira } from "react-icons/si";
import { motion } from "framer-motion";
const Loader = () => {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100" >
            <div className="relative w-24 h-24 rounded-full border-2 border-transparent bg-gradient-to-r from-orange-400 via-pink-500 to-yellow-500 animate-glow flex items-center justify-center">
                <motion.div
                    initial={{ y: "-100%", opacity: 0 }}
                    animate={{ y: "0%", opacity: 1 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                >
                    <SiJira className="text-4xl text-orange-400" />
                </motion.div>
            </div>
        </ div>
    )
}

export default Loader
