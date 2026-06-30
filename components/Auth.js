"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Auth() {

  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [loading,setLoading]=useState(false);
  const [signup,setSignup]=useState(false);

  async function handleSubmit(){

      setLoading(true);

      if(signup){

          const {error}=await supabase.auth.signUp({

              email,
              password

          });

          if(error){

              alert(error.message);

          }else{

              alert("Check your email for verification.");

          }

      }

      else{

          const {error}=await supabase.auth.signInWithPassword({

              email,
              password

          });

          if(error){

              alert(error.message);

          }

      }

      setLoading(false);

  }

  return(

<div className="flex h-screen items-center justify-center">

<div className="w-[420px] rounded-xl border p-8 shadow">

<h1 className="mb-6 text-3xl font-bold text-center">

{signup?"Create Account":"Login"}

</h1>

<input

className="w-full border rounded p-3 mb-4"

placeholder="Email"

value={email}

onChange={(e)=>setEmail(e.target.value)}

/>

<input

type="password"

className="w-full border rounded p-3 mb-6"

placeholder="Password"

value={password}

onChange={(e)=>setPassword(e.target.value)}

/>

<button

onClick={handleSubmit}

disabled={loading}

className="w-full bg-black text-white rounded p-3"

>

{loading?"Please wait...":signup?"Create Account":"Login"}

</button>

<button

className="mt-4 w-full"

onClick={()=>setSignup(!signup)}

>

{signup?

"Already have an account?"

:

"Create Account"

}

</button>

</div>

</div>

  )

}