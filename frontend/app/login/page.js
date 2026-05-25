"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const signIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        setError(loginError.message);
      } else if (data.user) {
        // Successfully logged in
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <style jsx>{`
        @import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Sora:wght@300;400;500;600;700&display=swap");

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .auth-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f5e6f8 0%, #e8d4f5 25%, #d9c5f0 50%, #c8b5eb 75%, #b8a5e6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: "Sora", sans-serif;
          position: relative;
          overflow: hidden;
        }

        .auth-container::before {
          content: "";
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle at 30% 30%, rgba(200, 150, 255, 0.15), transparent 70%);
          border-radius: 50%;
          top: -100px;
          left: -100px;
          pointer-events: none;
        }

        .auth-container::after {
          content: "";
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle at 70% 70%, rgba(180, 120, 255, 0.1), transparent 70%);
          border-radius: 50%;
          bottom: -150px;
          right: -150px;
          pointer-events: none;
        }

        .auth-wrapper {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          max-width: 1200px;
          width: 100%;
          align-items: center;
          position: relative;
          z-index: 10;
        }

        .illustration-side {
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 1000px;
        }

        .illustration-side svg {
          filter: drop-shadow(0 30px 60px rgba(120, 80, 200, 0.3));
          animation: float 6s ease-in-out infinite;
          width: 100%;
          max-width: 350px;
          height: auto;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotateZ(-2deg);
          }
          50% {
            transform: translateY(-20px) rotateZ(2deg);
          }
        }

        .form-side {
          display: flex;
          flex-direction: column;
        }

        .form-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 32px;
          padding: 60px;
          box-shadow: 0 20px 60px rgba(120, 80, 200, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.4);
          animation: slideIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .form-card h1 {
          font-size: 40px;
          font-weight: 700;
          background: linear-gradient(135deg, #6b4ba0 0%, #9b5fc9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 12px;
          font-family: "Poppins", sans-serif;
          letter-spacing: -0.5px;
        }

        .form-card p {
          color: #888;
          font-size: 15px;
          margin-bottom: 40px;
          font-weight: 400;
        }

        .form-group {
          margin-bottom: 24px;
          animation: slideIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }

        .form-group:nth-child(3) {
          animation-delay: 0.1s;
        }

        .form-group:nth-child(4) {
          animation-delay: 0.2s;
        }

        .form-group:nth-child(5) {
          animation-delay: 0.3s;
        }

        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
          animation: slideIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          animation-delay: 0.3s;
          opacity: 0;
        }

        .checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .checkbox-input {
          appearance: none;
          width: 20px;
          height: 20px;
          border: 2px solid #e8d4f5;
          border-radius: 6px;
          cursor: pointer;
          background: linear-gradient(135deg, #fafbfc 0%, #f5f8fa 100%);
          transition: all 0.3s ease;
          position: relative;
        }

        .checkbox-input:hover {
          border-color: #b8a5e6;
          box-shadow: 0 0 0 3px rgba(184, 165, 230, 0.1);
        }

        .checkbox-input:checked {
          background: linear-gradient(135deg, #9b5fc9 0%, #b8a5e6 100%);
          border-color: #9b5fc9;
        }

        .checkbox-input:checked::after {
          content: "✓";
          position: absolute;
          color: white;
          font-size: 12px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;;
        }

        .checkbox-label {
          font-size: 14px;
          color: #666;
          cursor: pointer;
          user-select: none;
          font-weight: 500;
        }

        .forgot-password {
          text-align: right;
        }

        .forgot-password a {
          font-size: 14px;
          color: #9b5fc9;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.3s ease;
        }

        .forgot-password a:hover {
          color: #7a3fa0;
          text-decoration: underline;
        }

        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #6b4ba0;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .input-wrapper {
          position: relative;
        }

        .form-group input {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #e8d4f5;
          border-radius: 14px;
          font-size: 15px;
          font-family: "Sora", sans-serif;
          background: linear-gradient(135deg, #fafbfc 0%, #f5f8fa 100%);
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .form-group input:focus {
          outline: none;
          border-color: #b8a5e6;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(184, 165, 230, 0.1);
          transform: translateY(-1px);
        }

        .form-group input::placeholder {
          color: #aaa;
        }

        .error-message {
          color: #e74c3c;
          font-size: 13px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 6px;
          animation: shake 0.5s ease;
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        .submit-btn {
          background: linear-gradient(135deg, #9b5fc9 0%, #b8a5e6 100%);
          color: white;
          border: none;
          padding: 16px 32px;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: "Poppins", sans-serif;
          margin-top: 8px;
          position: relative;
          overflow: hidden;
          letter-spacing: 0.3px;
          width: 100%;
          animation: slideIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          animation-delay: 0.4s;
          opacity: 0;
        }

        .submit-btn::before {
          content: "";
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }

        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(155, 95, 201, 0.4);
        }

        .submit-btn:hover::before {
          left: 100%;
        }

        .submit-btn:active {
          transform: translateY(0);
        }

        .submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .auth-link {
          text-align: center;
          margin-top: 24px;
          font-size: 14px;
          color: #666;
          animation: slideIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          animation-delay: 0.5s;
          opacity: 0;
        }

        .auth-link a {
          color: #9b5fc9;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.3s ease;
        }

        .auth-link a:hover {
          color: #7a3fa0;
          text-decoration: underline;
        }

        @media (max-width: 968px) {
          .auth-wrapper {
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .illustration-side {
            display: none;
          }

          .form-card {
            padding: 40px;
          }

          .form-card h1 {
            font-size: 32px;
          }
        }

        @media (max-width: 480px) {
          .form-card {
            padding: 28px;
          }

          .form-card h1 {
            font-size: 28px;
            margin-bottom: 8px;
          }

          .form-card p {
            font-size: 14px;
            margin-bottom: 32px;
          }

          .form-group {
            margin-bottom: 18px;
          }

          .checkbox-group {
            flex-direction: column;
            align-items: flex-start;
          }

          .forgot-password {
            text-align: left;
            margin-top: 8px;
          }
        }
      `}</style>

      <div className="auth-wrapper">
        <div className="illustration-side">
          <svg viewBox="0 0 300 400" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="potGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e8b4f8" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#d4a5f0" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#b891e6" stopOpacity="1" />
              </linearGradient>

              <linearGradient id="leafGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a8d5ff" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#9bc9f5" stopOpacity="1" />
                <stop offset="100%" stopColor="#8bb8f0" stopOpacity="0.95" />
              </linearGradient>

              <linearGradient id="leafGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d4a5f8" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#c895f0" stopOpacity="1" />
                <stop offset="100%" stopColor="#b885e8" stopOpacity="0.95" />
              </linearGradient>

              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <filter id="innerGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Pot */}
            <path
              d="M 80 280 Q 80 200 120 180 L 180 180 Q 220 200 220 280 L 220 320 Q 220 340 200 340 L 100 340 Q 80 340 80 320 Z"
              fill="url(#potGradient)"
              filter="url(#glow)"
              opacity="0.95"
            />

            {/* Pot highlight */}
            <path d="M 95 190 Q 100 185 110 185 L 115 280" fill="none" stroke="#ffffff" strokeWidth="8" opacity="0.3" />

            {/* Left leaf 1 */}
            <g>
              <ellipse cx="110" cy="120" rx="28" ry="65" fill="url(#leafGradient1)" filter="url(#glow)" opacity="0.9" transform="rotate(-35 110 120)" />
              <path d="M 105 60 Q 110 90 115 140" fill="none" stroke="#ffc0e8" strokeWidth="2" opacity="0.4" />
            </g>

            {/* Left leaf 2 */}
            <g>
              <ellipse cx="95" cy="150" rx="26" ry="60" fill="url(#leafGradient1)" filter="url(#glow)" opacity="0.85" transform="rotate(-50 95 150)" />
              <path d="M 88 95 Q 92 125 98 170" fill="none" stroke="#ffc0e8" strokeWidth="2" opacity="0.3" />
            </g>

            {/* Center left leaf */}
            <g>
              <ellipse cx="120" cy="90" rx="30" ry="70" fill="url(#leafGradient2)" filter="url(#glow)" opacity="0.92" transform="rotate(-15 120 90)" />
              <path d="M 120 25 Q 122 55 125 140" fill="none" stroke="#e8a0ff" strokeWidth="2" opacity="0.4" />
            </g>

            {/* Center leaf */}
            <g>
              <ellipse cx="150" cy="70" rx="32" ry="75" fill="url(#leafGradient1)" filter="url(#glow)" opacity="0.95" transform="rotate(0 150 70)" />
              <path d="M 150 10 Q 150 40 150 145" fill="none" stroke="#ffc0e8" strokeWidth="2" opacity="0.45" />
            </g>

            {/* Right leaf 1 */}
            <g>
              <ellipse cx="190" cy="100" rx="29" ry="68" fill="url(#leafGradient2)" filter="url(#glow)" opacity="0.88" transform="rotate(30 190 100)" />
              <path d="M 200 45 Q 196 75 188 145" fill="none" stroke="#e8a0ff" strokeWidth="2" opacity="0.35" />
            </g>

            {/* Right leaf 2 */}
            <g>
              <ellipse cx="210" cy="140" rx="27" ry="62" fill="url(#leafGradient1)" filter="url(#glow)" opacity="0.9" transform="rotate(50 210 140)" />
              <path d="M 218 85 Q 215 110 208 170" fill="none" stroke="#ffc0e8" strokeWidth="2" opacity="0.4" />
            </g>

            {/* Top right leaf */}
            <g>
              <ellipse cx="225" cy="110" rx="28" ry="65" fill="url(#leafGradient2)" filter="url(#glow)" opacity="0.87" transform="rotate(45 225 110)" />
              <path d="M 235 55 Q 232 80 225 155" fill="none" stroke="#e8a0ff" strokeWidth="2" opacity="0.3" />
            </g>

            {/* Floating sparkle effects */}
            <circle cx="100" cy="80" r="3" fill="#ffc0e8" opacity="0.6" filter="url(#glow)" />
            <circle cx="200" cy="100" r="3" fill="#ffc0e8" opacity="0.5" filter="url(#glow)" />
            <circle cx="150" cy="50" r="2.5" fill="#e8a0ff" opacity="0.4" filter="url(#glow)" />
          </svg>
        </div>

        <div className="form-side">
          <div className="form-card">
            <h1>Welcome Back</h1>
            <p>Sign in to your account to continue</p>

            {error && <div className="error-message">⚠ {error}</div>}

            <form onSubmit={signIn}>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="checkbox-group">
                <div className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    className="checkbox-input"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="rememberMe" className="checkbox-label">
                    Remember me
                  </label>
                </div>
                <div className="forgot-password">
                  <a href="/forgot-password">Forgot password?</a>
                </div>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>

            <div className="auth-link">
              Don't have an account?{" "}
              <a href="/signup">Create one here</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}