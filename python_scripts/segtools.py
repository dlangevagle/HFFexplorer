#Created by Miranda Apfel and Lucas Turner
#Texas A&M University
#You may freely use and alter this code


def mappix(seg,newseg,istart,iend,jstart,jend):  #expands segmentation map, takes seg, newseg as np arrays, x/y bounds of area to expand
    for i in range (istart,iend): #starting and ending x-pixels
        print i
        for j in range (jstart,jend): #starting and ending y pixels
            if newseg[i,j]==0:  #if pixel is empty, look around it for filled one (object), first down/up, then left/right then corners, then 2 down etc. If found, replace value with found one
                    for k in range(80):
                        yoff=[ 0, 0,-1, 1,-1,-1, 1, 1, 0, 0,-2, 2,-1,-1, 1, 1,-2,-2, 2, 2,-2,-2, 2, 2, 0, 0,-3, 3,-3,-3,-1,-1, 1, 1, 3, 3,-3,-3,-2,-2, 2, 2, 3, 3, 0, 0,-4, 4,-1,-1, 1, 1,-4,-4, 4, 4, -3,-3, 3, 3,-2,-2, 2, 2,-4,-4, 4, 4,-3,-3, 3, 3,-4,-4, 4, 4, 0, 0,-5, 5]
                        xoff=[-1, 1, 0, 0,-1, 1,-1, 1,-2, 2, 0, 0,-2, 2,-2, 2,-1, 1,-1, 1,-2, 2,-2, 2,-3, 3, 0, 0,-1, 1,-3, 3,-3, 3,-1, 1,-2, 2,-3, 3,-3, 3,-2, 2,-4, 4, 0, 0,-4, 4,-4, 4,-1, 1,-1, 1,-3, 3,-3, 3,-4, 4,-4, 4,-2, 2,-2, 2,-4, 4,-4, 4,-3, 3,-3, 3,-5, 5, 0, 0]
                        if newseg[i,j]==0:
                                if seg[i+yoff[k],j+xoff[k]]>0:
                                    newseg[i,j]=seg[i+yoff[k],j+xoff[k]]



def countpix(seg):
	count=0
	rows=len(seg)
	columns=len(seg[0])
	for i in range(rows):
		print(i)
		percent=i/float(rows)*100
		print(str(percent)+'%')
		for j in range(columns):
			if seg[i,j]>0:
				count=count+1
	print('count=')
	print(count)

def comparerow(seg1,seg2,row):
		columns=len(seg1[row])
		i=1
		for j in range(columns):
			if i==1:
				if seg1[row,j] != seg2[row,j]:
					i=0
					print('Rows differ')
					print(j)
		if i==1:
			print('Rows agree')


def findobject(seg,row):
	j=len(seg[row])
	for k in range(0,j):
		if seg[row][k]>0:
			obj=seg[row][k]
			y=row
			x=k
	print('x:'+str(x))
	print('y:'+str(y))
	print('id:'+str(obj))
	return x


def jsongen(seg, field, subnumber=1):
    #takes segmap as np array
    import os
    rows = len(seg) #gets number row
    columns = len(seg[0]) #gets number columns
    mlt = columns/subnumber #indexing for subdirectories
    if 'clu' in field:
        if 'abell' in field:
            fname = 'A'+field.replace('abell','').replace('clu','-clu')
        elif 'macs' in field:
            fname = 'M'+field.replace('macs','').replace('clu','-clu')
    elif 'par' in field:
        if 'abell' in field:
            fname = 'A'+field.replace('abell','').replace('par','-par')
        elif 'macs' in field:
            fname = 'M'+field.replace('macs','').replace('par','-par')
    for i in range(subnumber):
        if subnumber == 1:
            subname = '/Users/hff/HAWKI/Website/HFFexplorer/'+fname+'/JSON/seg/' #names each subdirectory
        else:
            subname = '/Users/hff/HAWKI/Website/HFFexplorer/'+fname+'/JSON/seg/'+str(i*mlt)+'/' #names each subdirectory
        try:
            os.stat(subname) #creates each subdirectory
        except:
            os.mkdir(subname)
        for j in range(mlt):
            filenumber = i*mlt+j
            filename = subname+str(filenumber)+'.js' #creates json file
            f = open(filename, 'w')
            f.write('['+str(seg[0,filenumber])+',\n') #writes first value
            for m in range(1, rows-1):
                f.write(str(seg[m, filenumber])+',\n') #writes middle values
            f.write(str(seg[rows-1, filenumber])+']') #writes last value
            f.close()

def update_seg(field):
    import astropy.io.fits as pyfits
    import numpy as np
    import glob
    seg = pyfits.open(glob.glob('/Users/hff/HAWKI/Release/%s/photometry/%s_bcgs_out_detection_seg.fits*' %(field.replace('clu',''), field.replace('clu','')))[0])
    filters = ['f814w','f105w','f125w','f140w','f160w']
    for filter in filters:
        res = pyfits.open(glob.glob('/Users/hff/HAWKI/Release/%s/images/masks/%s_bcgs_out_%s_res_mask.fits*' %(field.replace('clu',''), field.replace('clu',''), filter))[0])
        good = np.where((seg[0].data == 0) & (res[0].data > 20000))
        seg[0].data[good] = res[0].data[good]
    seg[0].data[seg[0].data > 40000] = 0
    seg.writeto('/Users/hff/HAWKI/FFweb/%s_updated_seg.fits' %(field), clobber=True)




