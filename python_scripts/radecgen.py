import astropy
table = astropy.table.Table()
from astropy.wcs import WCS
import glob

def radecgen(field):
    print(field)
    t = astropy.table.Table.read('/Users/hff/HAWKI/RGBs/rgb_framed.dat', format='ascii')
    data = t[t['field'] == field]
    # calculate ra, dec for NW, NE, SW, SE points
    header = astropy.io.fits.getheader(glob.glob('/Users/hff/HAWKI/RGBs/%s/images/%s-60mas_orig_f160w_*drz.fits*' %(field, field))[0])
    w = WCS(header)
    north = 6200 + data['ymax'] - data['yend']
    south = data['ymin'] - data['ystart']
    east = 6200 + data['xmax'] - data['xend']
    west = data['xmin'] - data['xstart']
    nw_ra, nw_dec = w.wcs_pix2world(west, north, 1)
    ne_ra, ne_dec = w.wcs_pix2world(east, north, 1)
    sw_ra, sw_dec = w.wcs_pix2world(west, south, 1)
    se_ra, se_dec = w.wcs_pix2world(east, south, 1)
    # find average ra, dec range
    w_ra = (nw_ra + sw_ra)/2.
    e_ra = (ne_ra + se_ra)/2.
    n_dec = (nw_dec + ne_dec)/2.
    s_dec = (sw_dec + se_dec)/2.
    print('RA: (%d, %f), (%d, %f)' %((data['xmin']-data['xstart']), w_ra, (6200-data['xend']+data['xmax']), e_ra))
    # formula for line
    x1 = (data['xmin']-data['xstart'])
    x2 = (6200-data['xend']+data['xmax'])
    rab = (e_ra*x1-w_ra*x2)/(x1-x2)
    ram = (e_ra-w_ra)/(x2-x1)
    if rab < 0:
        print('ra = %.16f*x%.16f' %(ram, rab))
    else:
        print('ra = %.16f*x+%.16f' %(ram, rab))
    print('Dec: (%d, %f), (%d, %f)' %((data['ymin']-data['ystart']), s_dec, (6200-data['yend']+data['ymax']), n_dec))
    y1 = (data['ymin']-data['ystart'])
    y2 = (6200-data['yend']+data['ymax'])
    decb = (n_dec*y1-s_dec*y2)/(y1-y2)
    decm = (n_dec-s_dec)/(y2-y1)
    if decb < 0:
        print('dec = %.16f*y%.16f' %(decm, decb))
    else:
        print('dec = %.16f*y+%.16f' %(decm, decb))