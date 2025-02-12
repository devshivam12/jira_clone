import { DottedSeparator } from '@/components/dotted-separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import React, { useEffect, useReducer, useRef, useState } from 'react';
import { Earth, Check, X, MoveLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const data = [
  {
    label: "Full Name",
    key: "full_name",
    access: "Anyone",
    icon: <Earth color='#757070' />,
    button: <Check color='#757070' />,
    cancel: <X color='#757070' />
  },
  {
    label: "Public Name",
    key: "public_name",
    access: "Anyone",
    icon: <Earth color='#757070' />,
    button: <Check color='#757070' />,
    cancel: <X color='#757070' />
  },
  {
    label: "Job Title",
    key: "job_title",
    access: "Anyone",
    icon: <Earth color='#757070' />,
    button: <Check color='#757070' />,
    cancel: <X color='#757070' />
  },
  {
    label: "Department",
    key: "department",
    access: "Anyone",
    icon: <Earth color='#757070' />,
    button: <Check color='#757070' />,
    cancel: <X color='#757070' />
  },
  {
    label: "Organization",
    key: "organization",
    access: "Anyone",
    icon: <Earth color='#757070' />,
    button: <Check color='#757070' />,
    cancel: <X color='#757070' />
  },
  {
    label: "Based In",
    key: "location",
    access: "Anyone",
    icon: <Earth color='#757070' />,
    button: <Check color='#757070' />,
    cancel: <X color='#757070' />
  },
  {
    label: "Local Time",
    key: "local_time",
    access: "Anyone",
    icon: <Earth color='#757070' />,
    button: <Check />,
    cancel: <X />
  },
];

const ProfileVisible = () => {
  const navigate = useNavigate()
  const [userData, setUserData] = useState(() => {
    const storeData = localStorage.getItem("userData");
    return storeData ? JSON.parse(storeData) : {};
  });

  console.log("UserData", userData);
  const [editingField, setEditingField] = useState(null)
  const [avatarImage, setAvatarImage] = useState(null);
  const [headerImage, setHeaderImage] = useState(null);
  const formRef = useRef(null)
  const avatarFileInput = useRef(null);
  const headerFileInput = useRef(null);

  // Handle avatar file selection
  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarImage(URL.createObjectURL(file));
    }
  };

  // Handle header file selection
  const handleHeaderFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setHeaderImage(URL.createObjectURL(file));
    }
  };

  // Trigger avatar file input click
  const handleAvatarClick = () => {
    avatarFileInput.current.click();
  };

  // Trigger header file input click
  const handleHeaderClick = () => {
    headerFileInput.current.click();
  };

  const displayButtons = (fieldKey) => {
    setEditingField(fieldKey)
  }

  const handleCancle = () => {
    setEditingField(null)
  }

  // const handleInputClick = (fieldKey) => {
  //   setEditingField(fieldKey)
  // }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (formRef.current && !formRef.current.contains(e.target)) {
        setEditingField(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  // Fallback text for the avatar
  const avatarFallback =
    userData?.first_name?.charAt(0)?.toUpperCase() ||
    userData?.email?.charAt(0)?.toUpperCase() ||
    "U";

  return (
    <div className="flex justify-center my-10">
      <div
        onClick={() => navigate(-1)}
        className='w-12 h-12 flex items-center justify-center p-2 rounded-full bg-neutral-200 cursor-pointer transition-all hover:bg-neutral-300'>
        <MoveLeft size={15} color="#404040" />
      </div>
      <div className="w-full max-w-[600px] px-6" ref={formRef}>
        <Card className="w-full">
          <CardHeader className="gap-y-2">
            <CardTitle>Profile and Visibility</CardTitle>
            <CardDescription className="text-xs">
              Manage your personal information, and control which information other people see and apps may access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form>
              {/* Header Image Section */}
              <div className="relative mb-12">
                <div
                  className="w-full h-24 md:h-32 bg-neutral-200 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-75 transition"
                  onClick={handleHeaderClick}
                  title="Upload header image"
                >
                  {headerImage ? (
                    <img
                      src={headerImage}
                      alt="Header"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-neutral-500 text-sm md:text-base">
                      Click to upload header image
                    </span>
                  )}
                </div>
                <Input
                  type="file"
                  ref={headerFileInput}
                  style={{ display: "none" }}
                  onChange={handleHeaderFileChange}
                  accept="image/*"
                />

                {/* Avatar Image Upload */}
                <div className="absolute top-14 left-10">
                  <Input
                    type="file"
                    ref={avatarFileInput}
                    style={{ display: "none" }}
                    onChange={handleAvatarFileChange}
                    accept="image/*"
                  />
                  <Avatar
                    className="size-20 hover:opacity-100 transition border-2 border-gray-100 cursor-pointer"
                    onClick={handleAvatarClick}
                    title="Upload profile picture"
                  >
                    {avatarImage ? (
                      <img
                        src={avatarImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="hover:bg-neutral-200 bg-neutral-300 font-medium transition text-neutral-500 flex items-center text-xl">
                        {avatarFallback}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </div>
              </div>

              <DottedSeparator className="mb-8" />

              {/* About You Section */}
              <div className="mb-10">
                <p className="text-lg font-semibold mb-4">About You</p>
                <div className="text-right">
                  <span className="text-neutral-400 text-xs font-normal">
                    Who can see this?
                  </span>
                </div>
                {data.map((item) => (
                  <div key={item.key} className="mb-6 relative">
                    <div className="flex items-center justify-between gap-10">
                      <div>
                        <span className="text-neutral-500 text-sm font-normal block mb-1">
                          {item.label}
                        </span>
                        <Input
                          type="text"
                          value={userData[item.key] || ""}
                          placeholder={item.label}
                          className="border-none border-gray-300 px-3 py-2 rounded-md transition focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-neutral-100"
                          onChange={(e) =>
                            setUserData({ ...userData, [item.key]: e.target.value })
                          }
                          onClick={() => displayButtons(item.key)}
                        />
                        {editingField === item.key && (
                          <div className='flex items-center float-right gap-3 mt-3'>
                            <Button
                              variant="default"
                              className="shadow-md hover:bg-neutral-100"
                            >
                              {item.button}

                            </Button>
                            <Button
                              variant="default"
                              className="shadow-md hover:bg-neutral-100"
                              onClick={handleCancle}
                            >
                              {item.cancel}

                            </Button>
                          </div>
                        )}
                      </div>
                      {/* Anyone Badge with Tooltip */}
                      <div className="relative group">
                        <div className="flex items-center gap-2 cursor-not-allowed">
                          {item.icon}
                          <span className="text-neutral-500 text-sm font-normal">
                            {item.access}
                          </span>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-8 w-64 bg-white text-gray-700 text-xs rounded-md shadow-md p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-gray-300">
                          If you provide a {item.label.toLowerCase()}, it will be visible to
                          anyone who can view your content, including people outside of your
                          organization. Accessible by installed apps.
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <DottedSeparator className="mb-8" />

              {/* Contact Section */}
              <div className="mb-8">
                <p className="text-lg font-semibold mb-4">Contact</p>
                <div>
                  <span className="text-neutral-500 text-sm font-normal block mb-1">
                    Email Address
                  </span>
                  <Input
                    type="email"
                    value={userData.email || ""}
                    placeholder="Email address"
                    className="border border-gray-300 px-3 py-2 rounded-md transition focus:outline-none focus:ring-2 focus:ring-blue-400 hover:bg-neutral-100"
                    onChange={(e) =>
                      setUserData({ ...userData, email: e.target.value })
                    }
                    disabled
                  />
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileVisible;
