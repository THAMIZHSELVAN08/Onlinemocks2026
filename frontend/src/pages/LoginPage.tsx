import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

// ─── Animated Light Blue + White Gradient Background ─────────────────────────
const ShaderBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const vert = `attribute vec2 a_position; void main(){gl_Position=vec4(a_position,0.0,1.0);}`;

    const frag = `
      precision highp float;
      uniform float u_time;
      uniform vec2  u_resolution;

      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float sn(vec2 p){
        vec2 i=floor(p),f=fract(p);
        f=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
      }
      float fbm(vec2 p){
        float v=0.0,a=0.5,fr=1.0;
        for(int i=0;i<5;i++){v+=a*sn(p*fr);a*=0.5;fr*=2.0;}
        return v;
      }

      void main(){
        vec2 uv=(gl_FragCoord.xy-0.5*u_resolution)/min(u_resolution.x,u_resolution.y);
        float t=u_time*0.10;

        vec2 q=vec2(fbm(uv+t*0.4), fbm(uv+vec2(3.1,1.7)+t*0.3));
        vec2 r=vec2(fbm(uv+3.5*q+vec2(1.7,9.2)+t*0.2), fbm(uv+3.5*q+vec2(8.3,2.8)+t*0.15));
        float f=fbm(uv+3.0*r+t*0.08);

        float s=smoothstep(0.0,1.0,f*f+0.5*f+0.15);

        // White → ice blue → sky → cobalt
        vec3 white  = vec3(0.97,0.99,1.00);
        vec3 ice    = vec3(0.88,0.94,0.99);
        vec3 sky    = vec3(0.72,0.86,0.97);
        vec3 mid    = vec3(0.44,0.68,0.93);
        vec3 cobalt = vec3(0.16,0.40,0.80);

        vec3 col = mix(white, ice,   s*1.3);
        col      = mix(col,   sky,   s*s*1.4);
        col      = mix(col,   mid,   pow(s,3.0)*0.9);

        // Cobalt accent wisps
        float wisp = fbm(uv*2.8 - q*1.1 + t*0.55);
        col += (cobalt-col)*pow(max(wisp-0.53,0.0),2.2)*1.2;

        // Very gentle vignette
        float vig=1.0-0.15*dot(uv,uv);
        col=clamp(col*vig,0.0,1.0);

        gl_FragColor=vec4(col,1.0);
      }
    `;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s,src); gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER,vert));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER,frag));
    gl.linkProgram(prog); gl.useProgram(prog);

    const buf=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(prog,'a_position');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);

    const uTime=gl.getUniformLocation(prog,'u_time');
    const uRes =gl.getUniformLocation(prog,'u_resolution');
    const start=performance.now();

    const render=()=>{
      gl.uniform1f(uTime,(performance.now()-start)/1000);
      gl.uniform2f(uRes,canvas.width,canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      rafRef.current=requestAnimationFrame(render);
    };
    render();
    return ()=>{ if(rafRef.current) cancelAnimationFrame(rafRef.current); window.removeEventListener('resize',resize); };
  },[]);

  return <canvas ref={canvasRef} style={{position:'fixed',inset:0,width:'100%',height:'100%',zIndex:0}}/>;
};

// ─── Login Page ──────────────────────────────────────────────────────────────
const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPw,   setShowPw]   = useState(false);
  const [mounted,  setMounted]  = useState(false);

  const setAuth  = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  useEffect(()=>{ setTimeout(()=>setMounted(true),60); },[]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res = await api.post('/auth/login',{username,password});
      setAuth(res.data.user, res.data.token);
      const r = res.data.user.role;
      if      (r==='ADMIN')     navigate('/admin');
      else if (r==='HR')        navigate('/hr');
      else if (r==='VOLUNTEER') navigate('/volunteer');
      else if (r==='PIPELINE')  navigate('/pipeline');
      else                      navigate('/');
    } catch(err:any){
      setError(err.response?.data?.message||'Authentication failed. Please check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      fontFamily:"'Plus Jakarta Sans',sans-serif",
      position:'relative', overflow:'hidden',
      background:'linear-gradient(140deg,#dbeafe 0%,#f0f7ff 45%,#e0eeff 100%)',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,600;1,400;1,500&family=JetBrains+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

        .lp-wrap{
          opacity:0; transform:translateY(22px);
          transition:opacity .85s cubic-bezier(.22,1,.36,1), transform .85s cubic-bezier(.22,1,.36,1);
        }
        .lp-wrap.in{opacity:1;transform:none;}

        .lp-card{
          background:rgba(255,255,255,0.78);
          backdrop-filter:blur(30px) saturate(150%);
          -webkit-backdrop-filter:blur(30px) saturate(150%);
          border:1.5px solid rgba(255,255,255,0.95);
          border-radius:24px;
          box-shadow:
            inset 0 2px 0 rgba(255,255,255,0.9),
            inset 0 -1px 0 rgba(148,196,245,0.25),
            0 24px 64px rgba(37,99,235,0.09),
            0 4px 16px rgba(37,99,235,0.05);
        }

        .lp-accent{
          background:linear-gradient(155deg,#1e40af 0%,#2563eb 38%,#3b82f6 72%,#60a5fa 100%);
          border-radius:16px;
          position:relative;overflow:hidden;
        }
        .lp-accent::before{
          content:'';position:absolute;inset:0;
          background:
            radial-gradient(ellipse at 25% 15%, rgba(255,255,255,0.20) 0%, transparent 55%),
            radial-gradient(ellipse at 75% 85%, rgba(96,165,250,0.20) 0%, transparent 50%);
        }
        .lp-grid{
          position:absolute;inset:0;
          background-image:
            linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),
            linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px);
          background-size:28px 28px;
        }

        .lp-input{
          width:100%;
          background:rgba(255,255,255,0.85);
          border:1.5px solid rgba(59,130,246,0.16);
          border-radius:10px;
          color:#0f172a;
          font-family:'Plus Jakarta Sans',sans-serif;
          font-size:14px;font-weight:500;
          height:50px;padding:0 14px;
          outline:none;
          transition:border-color .18s,background .18s,box-shadow .18s;
          box-shadow:0 1px 3px rgba(0,0,0,0.04),inset 0 1px 2px rgba(0,0,0,0.03);
        }
        .lp-input::placeholder{color:#94a3b8;font-weight:400;}
        .lp-input:focus{
          border-color:#3b82f6;background:#fff;
          box-shadow:0 0 0 3.5px rgba(59,130,246,0.13),0 1px 3px rgba(0,0,0,0.04);
        }

        .lp-btn{
          width:100%;height:50px;
          background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 55%,#3b82f6 100%);
          border:none;border-radius:10px;
          color:#fff;
          font-family:'JetBrains Mono',monospace;
          font-size:11px;font-weight:500;
          letter-spacing:.16em;text-transform:uppercase;
          cursor:pointer;position:relative;overflow:hidden;
          transition:transform .15s,box-shadow .2s;
          box-shadow:0 4px 20px rgba(37,99,235,.28),inset 0 1px 0 rgba(255,255,255,.12);
          display:flex;align-items:center;justify-content:center;gap:8px;
        }
        .lp-btn::after{
          content:'';position:absolute;top:0;left:-100%;
          width:55%;height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);
          transition:left .5s ease;
        }
        .lp-btn:hover::after{left:150%;}
        .lp-btn:hover{transform:translateY(-1px);box-shadow:0 8px 28px rgba(37,99,235,.32),inset 0 1px 0 rgba(255,255,255,.15);}
        .lp-btn:active{transform:scale(.985);}
        .lp-btn:disabled{opacity:.55;cursor:not-allowed;transform:none;}

        .lp-label{
          font-family:'JetBrains Mono',monospace;
          font-size:9.5px;font-weight:500;
          letter-spacing:.18em;text-transform:uppercase;
          color:#64748b;
          display:block;margin-bottom:7px;margin-left:1px;
        }


        .lp-error{
          background:rgba(239,68,68,0.06);
          border:1px solid rgba(239,68,68,0.18);
          border-radius:9px;padding:10px 13px;
          display:flex;align-items:center;gap:8px;
          color:#dc2626;font-size:12px;
          animation:lp-shake .35s cubic-bezier(.36,.07,.19,.97);
        }
        @keyframes lp-shake{
          10%,90%{transform:translateX(-2px);}
          20%,80%{transform:translateX(2px);}
          30%,50%,70%{transform:translateX(-3px);}
          40%,60%{transform:translateX(3px);}
        }

        .lp-eye{
          position:absolute;right:13px;top:50%;transform:translateY(-50%);
          background:none;border:none;color:#94a3b8;
          cursor:pointer;padding:4px;display:flex;align-items:center;
          transition:color .2s;
        }
        .lp-eye:hover{color:#2563eb;}

        .lp-badge{
          display:inline-flex;align-items:center;gap:6px;
          background:rgba(37,99,235,0.07);
          border:1px solid rgba(37,99,235,0.14);
          border-radius:100px;padding:4px 11px;
          font-family:'JetBrains Mono',monospace;
          font-size:9px;letter-spacing:.13em;
          color:#2563eb;
        }
        .lp-dot{
          width:5px;height:5px;border-radius:50%;
          background:#22c55e;
          box-shadow:0 0 5px rgba(34,197,94,0.7);
          animation:lp-pulse 2.2s ease-in-out infinite;
        }
        @keyframes lp-pulse{0%,100%{opacity:1;}50%{opacity:.2;}}


        .lp-orb{position:fixed;border-radius:50%;pointer-events:none;filter:blur(80px);z-index:0;}
        @keyframes lp-spin{to{transform:rotate(360deg);}}
      `}</style>

      <ShaderBackground />

      {/* Soft light orbs */}
      <div className="lp-orb" style={{width:700,height:700,top:-200,right:-150,background:'rgba(59,130,246,0.07)'}}/>
      <div className="lp-orb" style={{width:500,height:500,bottom:-150,left:-100,background:'rgba(147,197,253,0.10)'}}/>

      {/* Card */}
      <div className={`lp-wrap${mounted?' in':''}`} style={{width:'100%',maxWidth:980,padding:'0 20px'}}>
        <div className="lp-card" style={{display:'flex',overflow:'hidden',minHeight:600}}>

          {/* ── LEFT accent ── */}
          <div className="lp-accent" style={{width:'42%',padding:'48px 40px',display:'flex',flexDirection:'column',justifyContent:'space-between',flexShrink:0}}>
            <div className="lp-grid"/>

            {/* Wordmark */}
            <div style={{position:'relative',zIndex:1}}>
              <img src="/forese2.png" alt="FORESE" style={{ height: '100px', width: 'auto', display: 'block' }} />
            </div>
 
            {/* Center headline */}
            <div style={{position:'relative',zIndex:1,flex:1,display:'flex',alignItems:'center'}}>
              <div>
                <p style={{color:'rgba(255,255,255,0.45)',fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.2em',marginBottom:16,textTransform:'uppercase'}}>
                  Assessment Portal
                </p>
                <h2 style={{
                  color:'#fff',fontSize:54,fontWeight:700,
                  letterSpacing:'-0.04em',lineHeight:1.0,
                  fontFamily:"'Plus Jakarta Sans',sans-serif",
                }}>
                  MOCK<br/>
                  <span style={{
                    color:'rgba(255,255,255,0.42)',
                    fontSize:50,
                    fontWeight:700,
                  }}>
                    Placement
                  </span>
                </h2>
                <div style={{marginTop:18,display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:24,height:1,background:'rgba(255,255,255,0.3)'}}/>
                  <span style={{color:'rgba(255,255,255,0.35)',fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.15em'}}>
                    2026
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom accent */}
            <div style={{position:'relative',zIndex:1}}>
              <p style={{
                color:'rgba(255, 255, 255, 0.92)',
                fontFamily:"'JetBrains Mono',monospace",
                fontSize:10,
                letterSpacing:'.05em',
                fontWeight:500,
                marginTop: 20
              }}>
                Developed by Forese Development Team
              </p>
            </div>
          </div>

          {/* ── RIGHT form ── */}
          <div style={{flex:1,padding:'52px 52px',display:'flex',flexDirection:'column',justifyContent:'center'}}>
            <div style={{maxWidth:360,width:'100%',margin:'0 auto'}}>

              {/* Badge */}
              <div style={{marginBottom:30}}>
                <span className="lp-badge">
                  <span className="lp-dot"/>
                  MOCK PLACEMENT 2026
                </span>
              </div>

              {/* Heading */}
              <div style={{marginBottom:34}}>
                <h1 style={{
                  color:'#0f172a',fontSize:27,fontWeight:700,
                  letterSpacing:'-0.025em',lineHeight:1.2,
                  fontFamily:"'Plus Jakarta Sans',sans-serif",marginBottom:8,
                }}>
                  Sign in to your account
                </h1>
                <p style={{color:'#64748b',fontSize:13.5,lineHeight:1.55}}>
                  Enter your credentials to access the assessment portal.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} style={{display:'flex',flexDirection:'column',gap:18}}>
                <div>
                  <label className="lp-label">Authentication ID</label>
                  <input
                    type="text" className="lp-input"
                    placeholder="Username or Register ID"
                    value={username} onChange={e=>setUsername(e.target.value)} required
                  />
                </div>

                <div>
                  <label className="lp-label">Secret Key</label>
                  <div style={{position:'relative'}}>
                    <input
                      type={showPw?'text':'password'} className="lp-input"
                      placeholder="••••••••"
                      value={password} onChange={e=>setPassword(e.target.value)}
                      style={{paddingRight:42}} required
                    />
                    <button type="button" className="lp-eye" onClick={()=>setShowPw(v=>!v)}>
                      {showPw?<EyeOff size={15}/>:<Eye size={15}/>}
                    </button>
                  </div>
                </div>

                {error&&(
                  <div className="lp-error">
                    <AlertCircle size={13} style={{flexShrink:0}}/>
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" className="lp-btn" disabled={loading} style={{marginTop:4}}>
                  {loading
                    ?<Loader2 size={15} style={{animation:'lp-spin 1s linear infinite'}}/>
                    :'Authorize Access'
                  }
                </button>
              </form>



            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default LoginPage;