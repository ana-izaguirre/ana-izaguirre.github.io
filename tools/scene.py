#!/usr/bin/env python3
"""
Paisaje del hero: un horizonte continuo de Honduras (izquierda, cálido) a
Zaragoza (derecha, frío). Todo trazo propio generado en código.

Un único SVG sirve para los dos temas: los colores no van escritos en el
dibujo sino en variables CSS (--w0, --w1, …) que cambian con data-theme.
Así la noche no duplica la geometría ni los id de los degradados.

Uso:  python3 tools/scene.py        # reescribe el bloque marcado en index.html
"""
import math, random, re, pathlib
W,H=1680,900
def ridge(seed,y,amp,n,sharp=0.,at=.2):
    rnd=random.Random(seed);pts=[]
    for i in range(n+1):
        t=i/n;x=-80+t*(W+160)
        b=.45+.55*abs(math.sin(t*math.pi*2.1+seed))
        pk=max(0.,1-abs(t-at)*3.0)**1.7
        pts.append((x,y-(amp*b*(1+pk*sharp)+rnd.uniform(-amp*.06,amp*.06))))
    d=f"M{pts[0][0]:.0f} {H+80}L{pts[0][0]:.0f} {pts[0][1]:.0f}"
    for i in range(1,len(pts)):
        a,b_=pts[i-1],pts[i];d+=f"Q{a[0]:.0f} {a[1]:.0f} {(a[0]+b_[0])/2:.0f} {(a[1]+b_[1])/2:.0f}"
    return d+f"L{pts[-1][0]:.0f} {H+80}Z"
def trees(seed,y,x0,x1,hmin,hmax):
    """Arbolado con ritmo roto: cúmulos de varios tamaños y alguna conífera."""
    rnd=random.Random(seed);d=f"M{x0} {H+80}L{x0} {y}";x=x0
    while x<x1:
        cluster=rnd.randint(2,5)
        for _ in range(cluster):
            h=rnd.uniform(hmin,hmax);w=h*rnd.uniform(.45,.9)
            if rnd.random()<.22:
                d+=f"L{x+w*.46:.0f} {y-h*1.5:.0f}L{x+w:.0f} {y:.0f}"
            else:
                d+=f"C{x+w*.12:.0f} {y-h:.0f} {x+w*.88:.0f} {y-h:.0f} {x+w:.0f} {y:.0f}"
            x+=w*rnd.uniform(.55,.8)
        x+=rnd.uniform(6,34)
    return d+f"L{x1} {y}L{x1} {H+80}Z"
def hill(seed,y,amp,n,x0=-80,x1=W+80):
    rnd=random.Random(seed);pts=[]
    for i in range(n+1):
        t=i/n;pts.append((x0+t*(x1-x0),y-amp*(.4+.6*abs(math.sin(t*math.pi*1.6+seed)))+rnd.uniform(-6,6)))
    d=f"M{pts[0][0]:.0f} {H+80}L{pts[0][0]:.0f} {pts[0][1]:.0f}"
    for i in range(1,len(pts)):
        a,b=pts[i-1],pts[i];d+=f"Q{a[0]:.0f} {a[1]:.0f} {(a[0]+b[0])/2:.0f} {(a[1]+b[1])/2:.0f}"
    return d+f"L{pts[-1][0]:.0f} {H+80}Z"
def ceiba(cx,g,s):
    t=(f"M{cx-30*s:.0f} {g:.0f}C{cx-23*s:.0f} {g-14*s:.0f} {cx-11*s:.0f} {g-34*s:.0f} {cx-8*s:.0f} {g-74*s:.0f}"
       f"C{cx-7*s:.0f} {g-100*s:.0f} {cx-6*s:.0f} {g-114*s:.0f} {cx-6*s:.0f} {g-126*s:.0f}L{cx+6*s:.0f} {g-126*s:.0f}"
       f"C{cx+6*s:.0f} {g-114*s:.0f} {cx+7*s:.0f} {g-100*s:.0f} {cx+8*s:.0f} {g-74*s:.0f}"
       f"C{cx+11*s:.0f} {g-34*s:.0f} {cx+23*s:.0f} {g-14*s:.0f} {cx+30*s:.0f} {g:.0f}Z")
    for dx in(-18,-9,9,18):
        t+=(f"M{cx+dx*s*1.3:.0f} {g:.0f}Q{cx+dx*s*.6:.0f} {g-20*s:.0f} {cx+dx*s*.26:.0f} {g-40*s:.0f}"
            f"L{cx+dx*s*.08:.0f} {g-40*s:.0f}Q{cx+dx*s*.3:.0f} {g-18*s:.0f} {cx+dx*s*.9:.0f} {g:.0f}Z")
    c="";rnd=random.Random(21)
    for dx,dy,rx,ry in [(0,-168,98,24),(-60,-152,58,19),(62,-156,60,20),(-28,-180,54,18),(32,-182,52,17),(0,-194,40,14),(-86,-140,34,12),(88,-142,32,11)]:
        x,y,a,b=cx+dx*s+rnd.uniform(-3,3),g+dy*s,rx*s,ry*s
        c+=f"M{x-a:.0f} {y:.0f}a{a:.0f} {b:.0f} 0 1 0 {2*a:.0f} 0a{a:.0f} {b:.0f} 0 1 0 {-2*a:.0f} 0Z"
    br=""
    for sd,yy,ln,up in [(-1,-120,64,18),(1,-124,68,20),(-1,-142,46,13),(1,-146,42,12)]:
        x0,y0=cx+sd*5*s,g+yy*s;x1,y1=x0+sd*ln*s,y0-up*s
        br+=f"M{x0:.0f} {y0:.0f}Q{(x0+x1)/2:.0f} {y0-up*.25*s:.0f} {x1:.0f} {y1:.0f}"
    return t,c,br
def palm(cx,g,h,lean,seed):
    rnd=random.Random(seed);tx,ty=cx+lean,g-h
    t=(f"M{cx-3:.0f} {g:.0f}Q{cx+lean*.45:.0f} {g-h*.55:.0f} {tx-2:.0f} {ty:.0f}"
       f"L{tx+2:.0f} {ty:.0f}Q{cx+lean*.45+3:.0f} {g-h*.55:.0f} {cx+3:.0f} {g:.0f}Z")
    f=""
    for k in range(7):
        a=math.radians(190+k*27+rnd.uniform(-7,7));ln=h*rnd.uniform(.4,.58)
        ex,ey=tx+math.cos(a)*ln,ty+math.sin(a)*ln*.6;dr=ln*.32
        c1x,c1y=tx+math.cos(a)*ln*.45,ty+math.sin(a)*ln*.28-dr*.5
        f+=f"M{tx:.0f} {ty:.0f}Q{c1x:.0f} {c1y:.0f} {ex:.0f} {ey+dr:.0f}Q{c1x+2:.0f} {c1y+5:.0f} {tx:.0f} {ty+2:.0f}Z"
    return t,f
def pilar(cx,g,s):
    o=f"M{cx-150*s:.0f} {g:.0f}L{cx-150*s:.0f} {g-76*s:.0f}L{cx+150*s:.0f} {g-76*s:.0f}L{cx+150*s:.0f} {g:.0f}Z"
    for dx,r in [(0,42),(-64,26),(64,26),(-26,21),(26,21)]:
        x,b,rr=cx+dx*s,g-76*s,r*s
        o+=f"M{x-rr:.0f} {b:.0f}C{x-rr:.0f} {b-rr*1.6:.0f} {x+rr:.0f} {b-rr*1.6:.0f} {x+rr:.0f} {b:.0f}Z"
        o+=f"M{x-2*s:.0f} {b-rr*1.4:.0f}L{x-2*s:.0f} {b-rr*2:.0f}L{x+2*s:.0f} {b-rr*2:.0f}L{x+2*s:.0f} {b-rr*1.4:.0f}Z"
    for dx,th in [(-142,215),(-98,152),(98,152),(142,215)]:
        x,tw=cx+dx*s,13*s
        o+=f"M{x-tw:.0f} {g:.0f}L{x-tw:.0f} {g-th*s:.0f}L{x+tw:.0f} {g-th*s:.0f}L{x+tw:.0f} {g:.0f}Z"
        o+=f"M{x-tw*1.4:.0f} {g-th*s:.0f}L{x:.0f} {g-(th+46)*s:.0f}L{x+tw*1.4:.0f} {g-th*s:.0f}Z"
    return o
def cloud(cx,cy,s,seed):
    rnd=random.Random(seed);d=""
    for dx,dy,r in [(0,0,1),(-.78,.2,.66),(.8,.22,.62),(-.4,-.42,.62),(.44,-.38,.58),(1.4,.4,.4),(-1.36,.42,.38)]:
        x,y,rr=cx+dx*s,cy+dy*s*.52,r*s*.5*rnd.uniform(.9,1.1)
        d+=f"M{x-rr:.0f} {y:.0f}a{rr:.0f} {rr*.72:.0f} 0 1 0 {2*rr:.0f} 0a{rr:.0f} {rr*.72:.0f} 0 1 0 {-2*rr:.0f} 0Z"
    return d
def leaf(x,y,r,a,c=1.):
    ax,ay=math.cos(a),math.sin(a);px,py=x+ax*r,y+ay*r
    nx,ny=-ay*r*.46*c,ax*r*.46*c
    return f"M{x:.0f} {y:.0f}Q{x+ax*r*.5+nx:.0f} {y+ay*r*.5+ny:.0f} {px:.0f} {py:.0f}Q{x+ax*r*.5-nx:.0f} {y+ay*r*.5-ny:.0f} {x:.0f} {y:.0f}Z"
def bough(seed,pts,n,rmin,rmax):
    rnd=random.Random(seed);st=f"M{pts[0][0]} {pts[0][1]}"
    for i in range(1,len(pts)):
        a,b=pts[i-1],pts[i];st+=f"Q{a[0]+(b[0]-a[0])*.45:.0f} {a[1]+(b[1]-a[1])*.95:.0f} {b[0]} {b[1]}"
    lv=""
    for i in range(n):
        t=(i+.5)/n;k=min(len(pts)-2,int(t*(len(pts)-1)));ft=t*(len(pts)-1)-k
        x=pts[k][0]+(pts[k+1][0]-pts[k][0])*ft;y=pts[k][1]+(pts[k+1][1]-pts[k][1])*ft
        ba=math.atan2(pts[k+1][1]-pts[k][1],pts[k+1][0]-pts[k][0])
        for side in(-1,1):
            for _ in range(2):
                lv+=leaf(x,y,rnd.uniform(rmin,rmax),ba+side*rnd.uniform(.4,1.4),rnd.choice([-1,1]))
    return st,lv
def family(cx,g,s):
    o={}
    o['l']=(f"M{cx-58*s:.0f} {g-4*s:.0f}C{cx-28*s:.0f} {g-34*s:.0f} {cx+36*s:.0f} {g-32*s:.0f} {cx+66*s:.0f} {g-10*s:.0f}"
            f"L{cx+66*s:.0f} {g+8*s:.0f}L{cx-58*s:.0f} {g+8*s:.0f}Z")
    o['m']=(f"M{cx-46*s:.0f} {g:.0f}C{cx-52*s:.0f} {g-64*s:.0f} {cx-46*s:.0f} {g-128*s:.0f} {cx-36*s:.0f} {g-160*s:.0f}"
            f"C{cx-30*s:.0f} {g-182*s:.0f} {cx+26*s:.0f} {g-184*s:.0f} {cx+33*s:.0f} {g-160*s:.0f}"
            f"C{cx+43*s:.0f} {g-126*s:.0f} {cx+48*s:.0f} {g-62*s:.0f} {cx+45*s:.0f} {g:.0f}Z")
    hy=g-204*s
    o['h']=f"M{cx-23*s:.0f} {hy:.0f}a{23*s:.0f} {25*s:.0f} 0 1 0 {46*s:.0f} 0a{23*s:.0f} {25*s:.0f} 0 1 0 {-46*s:.0f} 0Z"
    o['hr']=(f"M{cx-24*s:.0f} {hy-3*s:.0f}C{cx-29*s:.0f} {hy-34*s:.0f} {cx+29*s:.0f} {hy-34*s:.0f} {cx+24*s:.0f} {hy-3*s:.0f}"
             f"C{cx+29*s:.0f} {hy+34*s:.0f} {cx+11*s:.0f} {hy+50*s:.0f} {cx:.0f} {hy+48*s:.0f}"
             f"C{cx-11*s:.0f} {hy+50*s:.0f} {cx-29*s:.0f} {hy+34*s:.0f} {cx-24*s:.0f} {hy-3*s:.0f}Z"
             f"M{cx-2*s:.0f} {hy-30*s:.0f}m{-18*s:.0f} 0a{18*s:.0f} {15*s:.0f} 0 1 0 {36*s:.0f} 0a{18*s:.0f} {15*s:.0f} 0 1 0 {-36*s:.0f} 0Z")
    bx,by=cx+60*s,g-82*s
    o['b']=(f"M{bx-23*s:.0f} {g+6*s:.0f}C{bx-26*s:.0f} {by+30*s:.0f} {bx-22*s:.0f} {by-8*s:.0f} {bx-16*s:.0f} {by-20*s:.0f}"
            f"C{bx-11*s:.0f} {by-31*s:.0f} {bx+14*s:.0f} {by-31*s:.0f} {bx+19*s:.0f} {by-20*s:.0f}"
            f"C{bx+24*s:.0f} {by-8*s:.0f} {bx+26*s:.0f} {by+30*s:.0f} {bx+24*s:.0f} {g+6*s:.0f}Z")
    o['a']=(f"M{bx+15*s:.0f} {by-8*s:.0f}C{bx+34*s:.0f} {by-24*s:.0f} {bx+62*s:.0f} {by-44*s:.0f} {bx+82*s:.0f} {by-58*s:.0f}"
            f"L{bx+87*s:.0f} {by-45*s:.0f}C{bx+62*s:.0f} {by-31*s:.0f} {bx+34*s:.0f} {by-9*s:.0f} {bx+17*s:.0f} {by+4*s:.0f}Z")
    bhy=by-41*s
    o['bh']=f"M{bx-16*s:.0f} {bhy:.0f}a{16*s:.0f} {17*s:.0f} 0 1 0 {32*s:.0f} 0a{16*s:.0f} {17*s:.0f} 0 1 0 {-32*s:.0f} 0Z"
    c="";rnd=random.Random(9)
    for dx,dy,r in [(0,-21,11.5),(-13,-15,9),(13,-15,9),(-17,-4,8),(17,-4,8),(-7,-26,8.5),(7,-26,8.5),(0,-9,10)]:
        x,y,rr=bx+dx*s,bhy+dy*s,r*s*rnd.uniform(.9,1.1)
        c+=f"M{x-rr:.0f} {y:.0f}a{rr:.0f} {rr:.0f} 0 1 0 {2*rr:.0f} 0a{rr:.0f} {rr:.0f} 0 1 0 {-2*rr:.0f} 0Z"
    o['bhr']=c
    return o
HOR=470
far=ridge(3,HOR+8,126,26,1.6,.15)
mid=ridge(9,HOR+34,78,24,1.0,.2)
t1=trees(21,HOR+66,-60,W+60,20,42)
t2=trees(33,HOR+118,-60,W+60,28,60)
FG=hill(41,HOR+228,46,14)
PIL=pilar(1150,HOR+62,.74)
CT,CC,CB=ceiba(232,HOR+150,1.12)
PT,PF="",""
rnd=random.Random(31)
for _ in range(7):
    cx=rnd.uniform(70,520);t,f=palm(cx,HOR+128,rnd.uniform(56,104),rnd.uniform(-10,10),int(cx));PT+=t;PF+=f
CL="".join(cloud(x,y,s,i) for i,(x,y,s) in enumerate([(320,124,280),(900,80,210),(1400,156,300),(170,244,170),(1140,224,180)]))
b1s,b1l=bough(1,[(-40,-30),(140,74),(320,42),(470,124),(620,72)],15,18,34)
b2s,b2l=bough(2,[(-30,86),(84,196),(44,352),(116,512)],12,17,32)
b3s,b3l=bough(3,[(W+40,-24),(W-140,76),(W-76,226),(W-186,356)],13,18,33)
F=family(820,HOR+252,1.0)
motes="".join(f'<circle cx="{rnd.uniform(80,W-80):.0f}" cy="{rnd.uniform(HOR-40,HOR+250):.0f}" r="{rnd.uniform(2,4.6):.1f}" opacity="{rnd.uniform(.4,.95):.2f}"/>' for _ in range(24))
tufts=""
for _ in range(55):
    x=rnd.uniform(-20,W+20);y=HOR+250+rnd.uniform(-10,30);h=rnd.uniform(12,30)
    tufts+=f"M{x:.0f} {y:.0f}Q{x+rnd.uniform(-5,5):.0f} {y-h*.6:.0f} {x+rnd.uniform(-10,10):.0f} {y-h:.0f}"
fl=""
for _ in range(34):
    x,y=rnd.uniform(0,W),HOR+268+rnd.uniform(0,H-HOR-280);r=rnd.uniform(6,11)
    for k in range(5):fl+=leaf(x,y,r,k*1.2566,1)

SVG=(f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<defs>
<filter id="rough" x="-6%" y="-6%" width="112%" height="112%">
<feTurbulence type="fractalNoise" baseFrequency="0.009 0.016" numOctaves="4" seed="7" result="n"/>
<feDisplacementMap in="SourceGraphic" in2="n" scale="11" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="rough2" x="-6%" y="-6%" width="112%" height="112%">
<feTurbulence type="fractalNoise" baseFrequency="0.013 0.021" numOctaves="4" seed="19" result="n"/>
<feDisplacementMap in="SourceGraphic" in2="n" scale="2.5" xChannelSelector="R" yChannelSelector="G"/>
</filter>
<filter id="soft" x="-8%" y="-8%" width="116%" height="116%">
<feTurbulence type="fractalNoise" baseFrequency="0.008" numOctaves="3" seed="3" result="n"/>
<feDisplacementMap in="SourceGraphic" in2="n" scale="14" xChannelSelector="R" yChannelSelector="G" result="d"/>
<feGaussianBlur in="d" stdDeviation="2.2"/>
</filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>
<feColorMatrix type="saturate" values="0"/></filter>
<linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A4D6EC"/><stop offset=".4" stop-color="#D2E8EB"/><stop offset=".7" stop-color="#F4E7CB"/><stop offset="1" stop-color="#FAE0B6"/></linearGradient>
<radialGradient id="su"><stop offset="0" stop-color="#FFF7E2" stop-opacity=".95"/><stop offset=".4" stop-color="#FFDFA0" stop-opacity=".38"/><stop offset="1" stop-color="#FFDFA0" stop-opacity="0"/></radialGradient>
<linearGradient id="g1" x1="0" x2="1"><stop offset="0" stop-color="#D5DCC9"/><stop offset=".5" stop-color="#CDDADA"/><stop offset="1" stop-color="#C6DAE4"/></linearGradient>
<linearGradient id="g2" x1="0" x2="1"><stop offset="0" stop-color="#AFC191"/><stop offset=".5" stop-color="#A2C2B0"/><stop offset="1" stop-color="#99C0CC"/></linearGradient>
<linearGradient id="g3" x1="0" x2="1"><stop offset="0" stop-color="#7A9C55"/><stop offset=".5" stop-color="#669578"/><stop offset="1" stop-color="#5F93A2"/></linearGradient>
<linearGradient id="g4" x1="0" x2="1"><stop offset="0" stop-color="#4F7338"/><stop offset=".5" stop-color="#3E6E52"/><stop offset="1" stop-color="#3A6B7A"/></linearGradient>
<linearGradient id="g5" x1="0" x2="1"><stop offset="0" stop-color="#2F4C24"/><stop offset=".55" stop-color="#27503A"/><stop offset="1" stop-color="#244C56"/></linearGradient>
</defs>
<rect width="{W}" height="{H}" fill="url(#sk)"/>
<circle class="sunpulse" cx="880" cy="268" r="280" fill="url(#su)"/><circle cx="880" cy="268" r="50" fill="#FFFAEC"/>
<g fill="#FFFFFF" opacity=".62" filter="url(#soft)"><g class="cloudL">{CL}</g></g>
<g filter="url(#soft)"><path d="{far}" fill="url(#g1)"/></g>
<g filter="url(#soft)"><path d="{mid}" fill="url(#g2)"/></g>
<g fill="#D6B486" opacity=".92" filter="url(#rough2)"><path d="{PIL}"/></g>
<g filter="url(#rough)"><path d="{t1}" fill="url(#g3)"/></g>
<g filter="url(#rough)"><path d="{t1}" fill="url(#g3)"/></g>
<g fill="url(#g3)" filter="url(#rough2)"><path d="{PT}"/><path d="{PF}"/></g>
<g filter="url(#rough)"><path d="{t2}" fill="url(#g4)"/></g>
<g fill="url(#g4)" filter="url(#rough2)"><path d="{CT}"/><path d="{CC}"/></g>
<path d="{CB}" stroke="#4E7A60" stroke-width="4" fill="none" stroke-linecap="round"/>
<g filter="url(#rough)"><path d="{FG}" fill="url(#g5)"/></g>
<g fill="#1E3A20" filter="url(#rough2)"><path d="{F['l']}"/><path d="{F['m']}"/><path d="{F['a']}"/><path d="{F['b']}"/></g>
<g fill="#162B18"><path d="{F['h']}"/><path d="{F['bh']}"/><path d="{F['hr']}"/><path d="{F['bhr']}"/></g>
<g fill="none" stroke="#20401F" stroke-width="2.2" stroke-linecap="round" opacity=".7"><path d="{tufts}"/></g>
<g fill="#E8A9B4" opacity=".75">{fl}</g>
<g fill="#4F7A52" opacity=".95"><g class="bough"><path d="{b1l}"/></g><g class="boughR"><path d="{b3l}"/></g></g>
<g fill="none" stroke="#3E6344" stroke-width="6" stroke-linecap="round"><g class="bough"><path d="{b1s}"/></g><g class="boughR"><path d="{b3s}"/></g></g>
<g fill="#39583C"><path d="{b2l}"/></g>
<g fill="none" stroke="#2E4A32" stroke-width="7" stroke-linecap="round"><path d="{b2s}"/></g>
<rect width="{W}" height="{H}" filter="url(#grain)" opacity=".055" style="mix-blend-mode:multiply"/>
</svg>''')

# noche: cada color del día tiene su pareja nocturna
NIGHT={
 '#A4D6EC':'#1B1838','#D2E8EB':'#2E2550','#F4E7CB':'#5B3A62','#FAE0B6':'#8E5468',
 '#FFF7E2':'#FFF1CF','#FFDFA0':'#F6C77E','#FFFAEC':'#FFF3D8',
 '#D5DCC9':'#4A3E66','#CDDADA':'#433D66','#C6DAE4':'#3D3B66',
 '#AFC191':'#3A3A57','#A2C2B0':'#323B57','#99C0CC':'#2D3A5A',
 '#7A9C55':'#283A3E','#669578':'#22363F','#5F93A2':'#1F3344',
 '#4F7338':'#1D2D2A','#3E6E52':'#182A2E','#3A6B7A':'#162735',
 '#2F4C24':'#121D18','#27503A':'#0F1C1C','#244C56':'#0E1A22',
 '#D6B486':'#3B2F4A','#1E3A20':'#0A120E','#162B18':'#060B08','#20401F':'#0B1610',
 '#E8A9B4':'#C98AA6','#4F7A52':'#22382B','#3E6344':'#1B2D22','#39583C':'#18291F','#2E4A32':'#121E17',
 '#4E7A60':'#1E3328','#FFFFFF':'#9C8BC0',
}

def themable(svg):
    cols=sorted(set(re.findall(r'#[0-9A-Fa-f]{6}',svg)),key=svg.index)
    names={c:f'--w{i}' for i,c in enumerate(cols)}
    svg=re.sub(r'stop-color="(#[0-9A-Fa-f]{6})"',lambda m:f'style="stop-color:var({names[m.group(1)]})"',svg)
    svg=re.sub(r'(fill|stroke)="(#[0-9A-Fa-f]{6})"',lambda m:f'style="{m.group(1)}:var({names[m.group(2)]})"',svg)
    light=';'.join(f'{n}:{c}' for c,n in names.items())
    dark=';'.join(f'{n}:{NIGHT.get(c.upper(),c)}' for c,n in names.items())
    return svg,light,dark

def night_extras():
    """Estrellas y ventanas encendidas: solo se ven de noche."""
    r=random.Random(4)
    stars=''.join(f'<circle cx="{r.uniform(0,W):.0f}" cy="{r.uniform(0,420):.0f}" r="{r.uniform(.7,1.9):.1f}" opacity="{r.uniform(.3,.9):.2f}"/>' for _ in range(90))
    win=''.join(f'<rect x="{x}" y="{y}" width="5" height="8" rx="2"/>' for x in range(1070,1240,22) for y in (482,500))
    return f'<g class="w-stars">{stars}</g>', f'<g class="w-win">{win}</g>'

def scoped(svg):
    """Los id del dibujo son globales en la página: van con prefijo para no chocar."""
    for i in set(re.findall(r'id="([^"]+)"',svg)):
        svg=svg.replace(f'id="{i}"',f'id="w-{i}"').replace(f'url(#{i})',f'url(#w-{i})')
    return svg

def build():
    svg=scoped(SVG).replace('<svg ','<svg class="land" ',1)
    svg=svg.replace('<g fill="#FFFFFF" opacity=".62"','<g class="w-cloud" fill="#FFFFFF"',1)
    svg,light,dark=themable(svg)
    stars,win=night_extras()
    svg=svg.replace('<circle class="sunpulse"',stars+'<circle class="sunpulse"',1)
    # las ventanas van justo después de la basílica
    k=svg.index('<path d="'+PIL[:40])
    k=svg.index('</g>',k)+4
    svg=svg[:k]+win+svg[k:]
    css=(f'.world{{{light}}}\nhtml:not([data-theme=light]) .world{{{dark}}}')
    return svg,css

if __name__=="__main__":
    svg,css=build()
    p=pathlib.Path(__file__).resolve().parent.parent/'index.html'
    html=p.read_text(encoding='utf-8')
    html=re.sub(r'<!-- scene:svg -->.*?<!-- /scene:svg -->',lambda m:'<!-- scene:svg -->'+svg+'<!-- /scene:svg -->',html,flags=re.S)
    html=re.sub(r'/\* scene:css \*/.*?/\* /scene:css \*/',lambda m:'/* scene:css */'+css+'/* /scene:css */',html,flags=re.S)
    p.write_text(html,encoding='utf-8')
    print(f'paisaje: {len(svg):,} bytes de SVG, {css.count("--w")//2} colores con pareja nocturna')
