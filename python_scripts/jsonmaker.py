#Created by Miranda Apfel
#Texas A&M University
#You may freely use and alter this code


def jsoncreate(segname, field, subnumber): #takes name of segmap to make json files, and number of sub-directories for json files, and field
    import astropy.io.fits as pyfits
    import numpy as np
    from segtools import jsongen

    hdulist = pyfits.open(segname) #opens two versions of originalseg
    hdu = hdulist[0]
    seg = hdu.data #converts to numpy array
    hdulist.close

    jsongen(seg, field, subnumber) #creates json files
