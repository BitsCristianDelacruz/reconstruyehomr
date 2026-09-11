from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from reportlab.lib.utils import ImageReader
from pypdf import PdfReader
img=ImageReader('output/escarapelas-comunidad-verde-v2.png')
iw,ih=img.getSize()
c=canvas.Canvas('output/pdf/escarapelas-carta-v2.pdf',pagesize=(612,792))
c.setTitle('Comunidad Verde - cinco escarapelas de 9 x 6 cm')
boxes=[(24,64,548,480),(554,64,1079,480),(24,506,548,924),(554,506,1079,924),(24,950,549,1365)]
w,h=9*cm,6*cm
gap=.6*cm
left=(612-2*w-gap)/2
top=(792+3*h+2*gap)/2
for i,(x0,y0,x1,y1) in enumerate(boxes):
    x=left+(i%2)*(w+gap); y=top-(i//2+1)*h-(i//2)*gap
    sx=w/((x1-x0)/1103*iw); sy=h/((y1-y0)/1426*ih)
    c.saveState()
    p=c.beginPath(); p.rect(x,y,w,h); c.clipPath(p,stroke=0)
    c.drawImage(img,x-x0/1103*iw*sx,y-(1-y1/1426)*ih*sy,width=iw*sx,height=ih*sy)
    c.restoreState()
c.showPage(); c.save()
r=PdfReader('output/pdf/escarapelas-carta-v2.pdf')
print('Verified:',len(r.pages),'page;',r.pages[0].mediabox)

