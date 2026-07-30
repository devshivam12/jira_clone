import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { DottedSeparator } from '../dotted-separator'
import { Input } from '../ui/input'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'


import { useLoginMutation, useVerifyOtpMutation, useResendOtpMutation } from '@/redux/api/authApi'
import { setAccessToken, setClientId, setUserData, userExist } from '@/redux/reducers/auth'
import { Eye, EyeOff, Mail, ArrowLeft } from 'lucide-react'
import { Label } from '../ui/label'
import ShowToast from '../common/ShowToast'
import ButtonLoader from '../ui/buttonLoader'
import { setAllProjects, setCurrentProject } from '@/redux/reducers/projectSlice'
import { useGetAllCompanyProjectQuery } from '@/redux/api/company/api'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp'

const OTP_LENGTH = 6
// How long the user must wait before they can ask for a new OTP. Keep this
// shorter than the backend OTP validity (5 minutes) so a fresh code is always
// reachable before the old one expires.
const RESEND_COOLDOWN_SECONDS = 60

const formatCountdown = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

// Partially hides the email the way most verification screens do, e.g.
// "jo****@gmail.com", so the user recognises their address without it being
// fully exposed on screen.
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email || ''
  const [name, domain] = email.split('@')
  if (name.length <= 2) return `${name[0] || ''}***@${domain}`
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(3, name.length - 2))}@${domain}`
}

const Login = () => {
  const dispatch = useDispatch()
  const { handleSubmit, register, reset, formState: { errors } } = useForm()
  const shouldNavigate = useRef(false)
  // const [shouldNavigate, setShouldNavigate] = useState(false)
  const { data: project, isSuccess } = useGetAllCompanyProjectQuery({
    skip: !shouldNavigate.current
  })

  const navigate = useNavigate()
  const [login, { isLoading, error }] = useLoginMutation()
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation()
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation()

  const [showPassword, setShowPassword] = useState(false)

  // 'credentials' shows the email/password form, 'otp' shows the OTP box.
  const [step, setStep] = useState('credentials')
  // The address the OTP was actually sent to. Comes back from the login
  // response so it is correct even when the user logs in with a username.
  const [otpEmail, setOtpEmail] = useState('')
  const [otp, setOtp] = useState('')
  // Seconds left before "Resend OTP" becomes clickable again.
  const [secondsLeft, setSecondsLeft] = useState(0)

  const isValidEmail = (input) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input);
  }

  useEffect(() => {
    if (!shouldNavigate.current || !isSuccess) return;

    shouldNavigate.current = false; // consume flag ✅

    dispatch(setAllProjects(project.data));
    dispatch(setCurrentProject(project.data[0]));

    const defaultTab = project.data[0].template.fields.tabs.find(tab => tab.isDefault);
    const defaultRouting = defaultTab ? defaultTab.url : 'backlog';

    navigate(`/dashboard/${project.data[0].project_slug}/${project.data[0].template.slug}/${defaultRouting}`);
    ShowToast.success('Login successful');
  }, [isSuccess, project, dispatch, navigate]);

  // Ticks the resend cooldown down to zero, one second at a time. When it hits
  // zero the effect stops rescheduling and the resend button unlocks.
  useEffect(() => {
    if (step !== 'otp' || secondsLeft <= 0) return
    const timer = setTimeout(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearTimeout(timer)
  }, [step, secondsLeft]);

  // Runs once the OTP is verified — this is the real "you are now logged in"
  // step. It stores the authenticated user in localStorage + Redux and flags a
  // navigate to the user's default project.
  const completeAuth = (response) => {
    const { project_details, ...userData } = response.user;
    dispatch(setUserData(userData))
    dispatch(setAccessToken(userData.token))
    localStorage.setItem('userData', JSON.stringify(userData))
    localStorage.setItem('accessToken', userData.token)
    localStorage.setItem('projectDetails', JSON.stringify(project_details))
    dispatch(userExist({
      ...response.user,
      role: response.user.role
    }));
    dispatch(setClientId(response.user.clientId));

    if (response.user.project_id.length > 0) {
      shouldNavigate.current = true
    }
  }

  // Step 1: check credentials. On success the backend sends an OTP to the
  // user's email and returns that email; we then switch to the OTP step.
  const handleLogin = async (formData) => {
    try {
      const response = await login(formData).unwrap()
      console.log("response", response)

      if (response.status === 200) {
        setOtpEmail(response.data?.email || formData.email || '')
        setOtp('')
        setStep('otp')
        setSecondsLeft(RESEND_COOLDOWN_SECONDS)   // start the resend cooldown
        ShowToast.success('OTP sent', {
          description: response.message || 'Please check your email for the OTP'
        })
        reset()
      }
      else if (response.status === 404) {
        ShowToast.error('Login failed', {
          description: response.message,
          useCustom: true
        })
      }
      else if (response.status === 400) {
        ShowToast.error('Login failed', {
          description: response.message,
          useCustom: true
        })
      }
      else {
        ShowToast.error('Login failed', {
          description: response.message || 'Please try again letter'
        })
      }

    } catch (error) {
      console.log("error", error)
      ShowToast.error(error.message)
    }
  }

  // Step 2: verify the OTP. On success the backend returns the authenticated
  // user (same shape the old direct login used) which we hand to completeAuth.
  const handleVerifyOtp = async () => {
    // Guard against a double submit — the code auto-verifies the moment all
    // digits are entered, so a click on the button right after would fire twice.
    if (isVerifying) return
    if (otp.length !== OTP_LENGTH) {
      ShowToast.error('Please enter the complete OTP')
      return
    }
    try {
      const response = await verifyOtp({ email: otpEmail, otp }).unwrap()
      console.log("verify response", response)

      if (response.status === 200 && response.user) {
        completeAuth(response)
      } else {
        setOtp('')   // wrong code — clear the boxes so they can retype
        ShowToast.error('Verification failed', {
          description: response.message || 'Wrong OTP, please try again',
          useCustom: true
        })
      }
    } catch (error) {
      console.log("error", error)
      setOtp('')
      ShowToast.error(error.message || 'Something went wrong, please try again')
    }
  }

  // Ask the backend for a brand new OTP. Only reachable once the cooldown has
  // run out (the button is disabled until then). Restarts the cooldown on success.
  const handleResend = async () => {
    if (secondsLeft > 0) return
    if (!otpEmail) {
      backToCredentials()
      return
    }
    try {
      const response = await resendOtp({ email: otpEmail }).unwrap()
      if (response.status === 200) {
        setOtp('')
        setSecondsLeft(RESEND_COOLDOWN_SECONDS)   // restart the cooldown
        ShowToast.success('OTP resent', {
          description: response.message || 'A new OTP was sent to your email'
        })
      } else {
        ShowToast.error('Could not resend OTP', {
          description: response.message,
          useCustom: true
        })
      }
    } catch (error) {
      ShowToast.error(error.message || 'Could not resend OTP')
    }
  }

  const backToCredentials = () => {
    setStep('credentials')
    setOtp('')
    setOtpEmail('')
    setSecondsLeft(0)
  }

  const onSubmit = (data) => {
    const isEmail = isValidEmail(data.identifier)

    const formData = {
      ...(isEmail ? { email: data.identifier } : { username: data.identifier }),
      password: data.password,
    };
    handleLogin(formData)
  }
  console.log("error", error)

  return (
    <div className='flex items-center justify-center h-screen'>
      <Card className="w-full md:w-[487px] border-none shadow-[0_3px_35px_rgba(0,0,0,0.25)]  shadow-indigo-300/50">
        <CardHeader className="flex items-center justify-center text-center p-7">
          <CardTitle className="text-2xl ">
            {step === 'credentials' ? 'Welcome back' : 'Verify your email'}
          </CardTitle>
        </CardHeader>
        <div className='px-7 mb-2'>
          <DottedSeparator />
        </div>

        {step === 'credentials' ? (
          <CardContent className='p-7'>
            <form className='space-y-4' onSubmit={handleSubmit(onSubmit)}>
              <div className='space-y-1'>
                <Label className="flex items-center font-semibold text-neutral-500 text-sm">
                  Email
                  <span className='text-red-300'>*</span>
                </Label>
                <Input
                  type="text"
                  required
                  placeholder="Ex. ex@gmail.com"
                  {...register('identifier', { required: true })}
                />
                {errors.identifier && <p className='text-red-500 text-sm'>{errors.identifier.message}</p>}
              </div>
              <div className=" space-y-1">
                <Label className="font-semibold flex items-center text-neutral-500">
                  Password
                  <span className='text-red-300'>*</span>
                </Label>
                <div className='flex items-center relative'>
                  <Input
                    type={showPassword === true ? 'text' : 'password'}
                    required
                    placeholder="Enter password"
                    {...register('password', { required: true })}
                  />
                  {showPassword ? (
                    <EyeOff
                      size={20}
                      className='text-neutral-500 absolute right-3 cursor-pointer'
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  ) : (
                    <Eye
                      size={20}
                      className='text-neutral-500 absolute right-3 cursor-pointer'
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  )}
                </div>
                {errors.password && <p className='text-red-500 text-sm'>{errors.password.message}</p>}
              </div>
              <ButtonLoader variant="teritary" type="submit" isLoading={isLoading} size="lg" className="w-full">
                Login
              </ButtonLoader>
            </form>
          </CardContent>
        ) : (
          <CardContent className='p-7 pt-2'>
            <div className='space-y-6'>
              <div className='flex justify-center'>
                <div className='flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 ring-8 ring-indigo-50/60'>
                  <Mail size={26} />
                </div>
              </div>

              <p className='text-sm text-neutral-500 text-center leading-relaxed'>
                Enter the {OTP_LENGTH} digit code we sent to
                <br />
                <span className='font-semibold text-neutral-700'>{maskEmail(otpEmail) || 'your email'}</span>
              </p>

              <div className='flex justify-center'>
                <InputOTP
                  maxLength={OTP_LENGTH}
                  value={otp}
                  onChange={setOtp}
                  onComplete={handleVerifyOtp}
                  disabled={isVerifying}
                  autoFocus
                >
                  <InputOTPGroup className='gap-2 sm:gap-3'>
                    {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className='h-12 w-12 rounded-md border border-input text-lg font-semibold'
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <ButtonLoader
                variant="teritary"
                size="lg"
                className="w-full"
                isLoading={isVerifying}
                onClick={handleVerifyOtp}
              >
                {isVerifying ? 'Verifying...' : 'Verify OTP'}
              </ButtonLoader>

              <p className='text-sm text-center text-neutral-500'>
                Didn&apos;t receive the code?{' '}
                {secondsLeft > 0 ? (
                  <span className='text-neutral-400'>Resend in {formatCountdown(secondsLeft)}</span>
                ) : (
                  <button
                    type='button'
                    className='font-semibold text-indigo-500 hover:underline disabled:opacity-50'
                    onClick={handleResend}
                    disabled={isResending}
                  >
                    {isResending ? 'Sending...' : 'Resend OTP'}
                  </button>
                )}
              </p>

              <div className='flex justify-center'>
                <button
                  type='button'
                  className='inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700'
                  onClick={backToCredentials}
                >
                  <ArrowLeft size={16} />
                  Back to login
                </button>
              </div>
            </div>
          </CardContent>
        )}

        {step === 'credentials' && (
          <>
            <div className='px-7'>
              <DottedSeparator />
            </div>
            <CardContent className="p-7 flex flex-col gap-y-4">
              <Link className='underline' to={'/register'}>
                Don&apos;t have an account
              </Link>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}

export default Login
