import astropy.table
table = astropy.table.Table()
import astropy.io.fits as pyfits
import glob
import numpy as np
import os
from PIL import Image, ImageDraw, ImageFont
import pylab
from scipy import misc
import scipy.interpolate
import unicorn

mainDir = '/Users/hff/HAWKI/'

def ffCutouts(field):
    if ('par' not in field) and ('clu' not in field): field = field + 'clu'
    if 'abell' in field:
        if 'clu' in field:
            fName = 'A%s-clu' %((field.replace('clu','')).replace('abell',''))
        elif 'par' in field:
            fName = 'A%s-par' %((field.replace('par','')).replace('abell',''))
    elif 'macs' in field:
        if 'clu' in field:
            fName = 'M%s-clu' %((field.replace('clu','')).replace('macs',''))
        elif 'par' in field:
            fName = 'M%s-par' %((field.replace('par','')).replace('macs',''))

    catName = glob.glob('%sRelease/%s/catalogs/hffds_%s_v*.cat' %(mainDir, field.replace('clu',''), field))[-1]
    version = str((catName.split('_v')[1]).split('.cat')[0])
    cat = table.read(catName, format='ascii')

    for id in cat['id']:
        if id < 20000:
            print unicorn.noNewLine+'%i' %(id)
            index = str((id/100)*100)
            im = Image.open('%sWebsite/HFFexplorer/%s/object_figs/%s/%i.png' %(mainDir, fName, index, id))
            if im.mode == 'RGBA':
                im = im.convert('RGB')
            sed = im.crop((23, 0, 1913, 1110))
            sed.save('%sWebsite/HFFexplorer/%s/object_figs/%s/sed_%i.png' %(mainDir, fName, index, id))
            sed = misc.imread('%sWebsite/HFFexplorer/%s/object_figs/%s/sed_%i.png' %(mainDir, fName, index, id))
            sed[:, 1840:] = [255, 255, 255]
            misc.imsave('%sWebsite/HFFexplorer/%s/object_figs/%s/sed_%i.png' %(mainDir, fName, index, id), sed)
            pfz = im.crop((1884, 0, 2934, 1110))
            pfz.save('%sWebsite/HFFexplorer/%s/object_figs/%s/pfz_%i.png' %(mainDir, fName, index, id))
            rgb1 = im.crop((2943, 0, 3909, 1012))
            rgb1.save('%sWebsite/HFFexplorer/%s/object_figs/%s/rgb1_%i.png' %(mainDir, fName, index, id))
            rgb1 = misc.imread('%sWebsite/HFFexplorer/%s/object_figs/%s/rgb1_%i.png' %(mainDir, fName, index, id))
            rgb1[972:1012,:] = [255, 255, 255]
            misc.imsave('%sWebsite/HFFexplorer/%s/object_figs/%s/rgb1_%i.png' %(mainDir, fName, index, id), rgb1)
            rgb2 = im.crop((3933, 0, 4899, 1012))
            rgb2.save('%sWebsite/HFFexplorer/%s/object_figs/%s/rgb2_%i.png' %(mainDir, fName, index, id))
            rgb2 = misc.imread('%sWebsite/HFFexplorer/%s/object_figs/%s/rgb2_%i.png' %(mainDir, fName, index, id))
            rgb2[972:1012,:] = [255, 255, 255]
            misc.imsave('%sWebsite/HFFexplorer/%s/object_figs/%s/rgb2_%i.png' %(mainDir, fName, index, id), rgb2)
            rgb3 = im.crop((4923, 0, 5889, 1012))
            rgb3.save('%sWebsite/HFFexplorer/%s/object_figs/%s/rgb3_%i.png' %(mainDir, fName, index, id))
            rgb3 = misc.imread('%sWebsite/HFFexplorer/%s/object_figs/%s/rgb3_%i.png' %(mainDir, fName, index, id))
            rgb3[972:1012,:] = [255, 255, 255]
            misc.imsave('%sWebsite/HFFexplorer/%s/object_figs/%s/rgb3_%i.png' %(mainDir, fName, index, id), rgb3)
            det = im.crop((2943, 964, 3909, 1976))
            det.save('%sWebsite/HFFexplorer/%s/object_figs/%s/det_%i.png' %(mainDir, fName, index, id))
            seg = im.crop((3933, 964, 4899, 1976))
            seg.save('%sWebsite/HFFexplorer/%s/object_figs/%s/seg_%i.png' %(mainDir, fName, index, id))
            mag = im.crop((4923, 964, 6000, 1976))
            mag.save('%sWebsite/HFFexplorer/%s/object_figs/%s/mag_%i.png' %(mainDir, fName, index, id))
        else:
            print unicorn.noNewLine+'%i' %(id)
            index = str((id/100)*100)
            im = Image.open('%sWebsite/HFFexplorer/%s/object_figs/%s/%i.png' %(mainDir, fName, index, id))
            if im.mode == 'RGBA':
                im = im.convert('RGB')
            sed = im.crop((23, 0, 1913, 1110))
            sed.save('%sWebsite/HFFexplorer/%s/object_figs/%s/sed_%i.png' %(mainDir, fName, index, id))
            sed = misc.imread('%sWebsite/HFFexplorer/%s/object_figs/%s/sed_%i.png' %(mainDir, fName, index, id))
            sed[:, 1840:] = [255, 255, 255]
            misc.imsave('%sWebsite/HFFexplorer/%s/object_figs/%s/sed_%i.png' %(mainDir, fName, index, id), sed)
            pfz = im.crop((1884, 0, 2934, 1110))
            pfz.save('%sWebsite/HFFexplorer/%s/object_figs/%s/pfz_%i.png' %(mainDir, fName, index, id))
            rgb1 = im.crop((2943, 0, 3909, 1012))
            rgb1.save('%sWebsite/HFFexplorer/%s/object_figs/%s/rgb1_%i.png' %(mainDir, fName, index, id))
            rgb1 = misc.imread('%sWebsite/HFFexplorer/%s/object_figs/%s/rgb1_%i.png' %(mainDir, fName, index, id))
            rgb1[972:1012,:] = [255, 255, 255]
            misc.imsave('%sWebsite/HFFexplorer/%s/object_figs/%s/rgb1_%i.png' %(mainDir, fName, index, id), rgb1)
            rgb2 = im.crop((3933, 0, 4899, 1012))
            rgb2.save('%sWebsite/HFFexplorer/%s/object_figs/%s/rgb2_%i.png' %(mainDir, fName, index, id))
            rgb2 = misc.imread('%sWebsite/HFFexplorer/%s/object_figs/%s/rgb2_%i.png' %(mainDir, fName, index, id))
            rgb2[972:1012,:] = [255, 255, 255]
            misc.imsave('%sWebsite/HFFexplorer/%s/object_figs/%s/rgb2_%i.png' %(mainDir, fName, index, id), rgb2)
            rgb3 = im.crop((4923, 0, 5889, 1012))
            rgb3.save('%sWebsite/HFFexplorer/%s/object_figs/%s/rgb3_%i.png' %(mainDir, fName, index, id))
            rgb3 = misc.imread('%sWebsite/HFFexplorer/%s/object_figs/%s/rgb3_%i.png' %(mainDir, fName, index, id))
            rgb3[972:1012,:] = [255, 255, 255]
            misc.imsave('%sWebsite/HFFexplorer/%s/object_figs/%s/rgb3_%i.png' %(mainDir, fName, index, id), rgb3)

def ffInfoJSON(field):
    if ('par' not in field) and ('clu' not in field): field = field + 'clu'
    if 'abell' in field:
        if 'clu' in field:
            fName = 'A%s-clu' %((field.replace('clu','')).replace('abell',''))
        elif 'par' in field:
            fName = 'A%s-par' %((field.replace('par','')).replace('abell',''))
    elif 'macs' in field:
        if 'clu' in field:
            fName = 'M%s-clu' %((field.replace('clu','')).replace('macs',''))
        elif 'par' in field:
            fName = 'M%s-par' %((field.replace('par','')).replace('macs',''))

    catName = glob.glob('%sRelease/%s/catalogs/hffds_%s_v*.cat' %(mainDir, field.replace('clu',''), field))[-1]
    version = str((catName.split('_v')[1]).split('.cat')[0])
    cat1 = table.read(catName, format='ascii')
    cat2 = table.read('%sRelease/%s/catalogs/eazy/%s_v%s/%s_v%s.zout' %(mainDir, field.replace('clu',''), field, version, field, version), format='ascii')
    cat3 = table.read('%sRelease/%s/catalogs/fast/%s_v%s/%s_v%s.fout' %(mainDir, field.replace('clu',''), field, version, field, version), format='ascii', header_start=17)
    cat5 = table.read('%sRelease/%s/catalogs/eazy/%s_v%s/%s_v%s.153.rf' %(mainDir, field.replace('clu',''), field, version, field, version), format='ascii')
    cat6 = table.read('%sRelease/%s/catalogs/eazy/%s_v%s/%s_v%s.155.rf' %(mainDir, field.replace('clu',''), field, version, field, version), format='ascii')
    cat7 = table.read('%sRelease/%s/catalogs/eazy/%s_v%s/%s_v%s.161.rf' %(mainDir, field.replace('clu',''), field, version, field, version), format='ascii')
    ids = cat1['id']
    for id in ids:  #numpy is 0 indexed, so we need the index to be one less than the object number
        objnum = id #number of the object as an integer
        i = np.where(cat1['id'] == id)[0][0]
        index = str((objnum/100)*100)  #pulls 100s place
        X = str(round(cat1['x'][i], 1))   #parameters from catalogs as strings
        Y = str(round(cat1['y'][i], 1))
        RA = cat1['ra'][i]
        RA = '%.5f' %(RA)
        DEC = cat1['dec'][i]
        DEC = '%.5f' %(DEC)
        f160 = cat1['f_F160W'][i]   #as a float, since used in math
        f814 = cat1['f_F814W'][i]
        star = str(int(cat1['star_flag'][i]))
        z_peak = str(round(cat2['z_peak'][i], 2))
        if z_peak == '-99.0':
            z_peak = '-99'
        use = str(int(cat1['use_phot'][i]))
        zspec = cat2['z_spec'][i]
        if zspec > 0:
            z_spec = str(round(zspec, 2))
        else:
            z_spec = '-99' #removes zspecs less than 0
        sfr = cat3['lsfr'][i]
        mass = cat3['lmass'][i]
        ssfr = cat3['lssfr'][i]
        if ssfr == -1:
            ssfr = '-99'
        elif np.isnan(ssfr):
            ssfr = '-99'
        else:
            ssfr = str(ssfr)
        if mass == -1:
            mass = '-99'  #removes bad values
        elif np.isnan(mass):  #removes bad values
            mass = '-99'
        else:
            mass = str(mass)
        if str(sfr) == '-1.0':    #removes bad values
            sfr = '-99'
        elif np.isnan(sfr): #removes bad values
            sfr = '-99'
        else:
            sfr = str(sfr)
        agn = 'No'
        U = cat5['L153'][i]  #floats
        Udm = cat5['DM'][i]
        V = cat6['L155'][i]
        Vdm = cat6['DM'][i]
        J = cat7['L161'][i]
        Jdm = cat7['DM'][i]
        if (U>0) & (V>0):
            UV_rest = (-2.5 * np.log10(U) + 25. - Udm) - (-2.5 * np.log10(V) + 25. - Vdm)  #converts to mag
            UV = str(round(UV_rest, 2))  #color as a string
        else:
            UV = '-99' #removes bad values
        if (V>0) & (J>0):
            VJ_rest = (-2.5 * np.log10(V) + 25. - Vdm) - (-2.5 * np.log10(J) + 25. - Jdm) #converts to mag
            VJ = str(round(VJ_rest, 2))
        else:
            VJ = '-99' #removes bad values
        if f160 > 0:
            mag160 = str(round(-2.5 * np.log10(f160) + 25., 2)) #mag_K as a string
        else:
            mag160 = '-99' #removes bad values
        if f814 > 0:
            mag814 = str(round(-2.5 * np.log10(f814) + 25., 2))
        else:
            mag814 = '-99'  #removes bad values
        print('{ "id": %i,\n  "ra": %s,\n  "dec": %s,\n  "x": %s,\n  "y": %s,\n  "z_spec": %s,\n  "z_phot": %s,\n  "mag814": %s,\n  "mag160": %s,\n  "use": %s,\n  "star": %s,\n  "uv": %s,\n  "vj": %s,\n  "mass": %s,\n  "sfr": %s,\n  "ssfr": %s\n},' %(objnum, RA, DEC, X, Y, z_spec, z_peak, mag814, mag160, use, star, UV, VJ, mass, sfr, ssfr))


def ffStamps(field, size=167, pixscl=0.06, filterSet='acs', b=2., saveExt='png', startID=1, endID=20100):
    """ Creates stamp cutouts from RGB images for each catalog source
    # Notes: misc.imread indexes arrays from the top left corner,
    # catalog "y" indexing is reversed, going from the bottom to the top.
    # ("acs", 167, 2.), ("ijh", 251, 2.), ("ijk", 251, 2.), ("det", 167, 2.)
    # field: field name
    # size: size of cutout (i.e. 167 x 167 pixels)
    # filterSet: "acs", "ijh", or "ijk"
    # b: brighten stamp (> 1 to lighten, < 1 to darken)
    # saveExt: "png", "jpg", etc.
    """

    # read in RGB images
    if ('par' not in field) and ('clu' not in field): field = field + 'clu'
    
    if 'abell' in field:
        if 'clu' in field:
            fName = 'A%s-clu' %((field.replace('clu','')).replace('abell',''))
        elif 'par' in field:
            fName = 'A%s-par' %((field.replace('par','')).replace('abell',''))
    elif 'macs' in field:
        if 'clu' in field:
            fName = 'M%s-clu' %((field.replace('clu','')).replace('macs',''))
        elif 'par' in field:
            fName = 'M%s-par' %((field.replace('par','')).replace('macs',''))
    
    rgb = misc.imread(glob.glob('%sRGBs/%s/%s-60mas_%s_bcgs_out_rgb.*.png' %(mainDir, field, field, filterSet))[-1])
    if endID > 20000 and filterSet != 'det':
        origRGB = misc.imread(glob.glob('%sRGBs/%s/%s-60mas_%s_rgb.*.png' %(mainDir, field, field, filterSet))[-1])

    # read in most recent catalog
    catName = glob.glob('%sRelease/%s/catalogs/hffds_%s_v*.cat' %(mainDir, field.replace('clu',''), field))[-1]
    version = str((catName.split('_v')[1]).split('.cat')[0])
    cat = table.read(catName, format='ascii')

    # pixel size should be an odd number so that source is centered
    r = (size-1)/2
    # create cutouts for each catalog source
    ids = range(startID, endID)
    for id in ids:
        if id in cat['id'] and id < 20000:
            print()
            print unicorn.noNewLine+'%d' %(id)
            if filterSet == 'det':
                stamp = np.ones((size, size, 3), dtype='float')*28
            else:
                stamp = np.zeros((size, size, 3), dtype='float')
            index = str((id/100)*100)
            i = np.where(cat['id'] == id)[0][0]
            x = int(np.round(cat['x'][i]))
            xmin = x-r
            xmax = x+r+1
            y = int(np.round(cat['y'][i]))
            # reverse y indexing.
            ymin = rgb.shape[0]-(y+r+1)
            ymax = rgb.shape[0]-(y-r)
            # check if cutout contains pixels outside of image bounds
            if ymin < 0 and xmin < 0:
                stamp[-1*ymin:, -1*xmin:] = rgb[:size+ymin, :size+xmin]
            elif ymin < 0 and xmax > rgb.shape[1]:
                stamp[-1*ymin:, :size-(xmax-rgb.shape[1])] = rgb[:size+ymin, xmin:]
            elif ymax > rgb.shape[0] and xmin < 0:
                stamp[:size-(ymax-rgb.shape[0]):, -1*xmin:] = rgb[ymin:, :size+xmin]
            elif ymax > rgb.shape[0] and xmax > rgb.shape[1]:
                stamp[:size-(ymax-rgb.shape[0]):, :size-(xmax-rgb.shape[1])] = rgb[ymin:, xmin:]
            elif ymin < 0:
                stamp[-1*ymin:, :] = rgb[:size+ymin, xmin:xmax]
            elif ymax > rgb.shape[0]:
                stamp[:size-(ymax-rgb.shape[0]):, :] = rgb[ymin:, xmin:xmax]
            elif xmin < 0:
                stamp[:, -1*xmin:] = rgb[ymin:ymax, :size+xmin]
            elif xmax > rgb.shape[1]:
                stamp[:, :size-(xmax-rgb.shape[1])] = rgb[ymin:ymax, xmin:]
            else:
                stamp[:] = rgb[ymin:ymax, xmin:xmax]

            # adjust brightness of stamp
            if b != 1:
                stamp = stamp * b
                stamp[np.where(stamp > 255)] = 255

            # set 1" scale bar
            scaleBarSize = int(np.round(1./pixscl))
            stamp[r+scaleBarSize:r+2*scaleBarSize, r:r+1] = (0, 255, 0)
            stamp[r:r+1, r-2*scaleBarSize:r-scaleBarSize] = (0, 255, 0)

            # add border
            stamp[0:, 0] = [0, 0, 0]
            stamp[0:, -1] = [0, 0, 0]
            stamp[0, 0:] = [0, 0, 0]
            stamp[-1, 0:] = [0, 0, 0]

            # save cutout
            fileName = '%sFFweb/%s/object_cutouts/%s/%i_%s_rgb.%s' %(mainDir, fName, index, id, filterSet, saveExt)
            misc.imsave(fileName, stamp)

            if filterSet == 'det':
                message = ''
            if filterSet == 'acs':
                message = 'F435W F606W F814W'
            elif filterSet == 'ijh':
                message = 'F814W F125W F160W'
            elif filterSet == 'ijk':
                message = 'F814W F105W+F125W Ks'
            stamp = Image.open(fileName)
            stamp = stamp.resize((1000, 1000))
            draw = ImageDraw.Draw(stamp)
            font = ImageFont.truetype('%sFFweb/arial.ttf' %(mainDir), size=60)
            color = 'rgb(255, 255, 255)'
            (x, y) = (30, 910)
            draw.text((x, y), message, fill=color, font=font)
            draw2 = ImageDraw.Draw(stamp)
            if filterSet == 'acs':
                font = ImageFont.truetype('%sFFweb/arial.ttf' %(mainDir), size=60)
                if size == 167:
                    draw2.text((320, 512), '1"', fill='rgb(0, 255, 0)', font=font) #10"x10"
                elif size == 251:
                    draw2.text((365, 512), '1"', fill='rgb(0, 255, 0)', font=font) #15"x15"
                elif size == 333:
                    draw2.text((395, 512), '1"', fill='rgb(0, 255, 0)', font=font) #20"x20"
            #elif filterSet == 'ijk':
            #    font = ImageFont.truetype('%sFFweb/arial.ttf' %(mainDir), size=40)
            #    draw2.text((382, 510), '1"', fill='rgb(0, 255, 0)', font=font)
            stamp.save(fileName)
            stamp.close()
                

        elif id in cat['id'] and id > 20000 and filterSet != 'det':
            stamp = np.zeros(((size-1)*2+1, (size-1)*2+1, 3), dtype='float')
            bcgsOutStamp = np.zeros(((size-1)*2+1, (size-1)*2+1, 3), dtype='float')
            r = (size-1)
            index = str((id/100)*100)
            x = int(np.round(cat['x'][cat['id'] == id]))
            xmin = x-r
            xmax = x+r+1
            y = int(np.round(cat['y'][cat['id'] == id]))
            # reverse y indexing.
            ymin = origRGB.shape[0]-(y+r+1)
            ymax = origRGB.shape[0]-(y-r)
            # check if cutout contains pixels outside of image bounds
            if ymin < 0 and xmin < 0:
                stamp[-1*ymin:, -1*xmin:] = origRGB[:size+ymin, :size+xmin]
                bcgsOutStamp[-1*ymin:, -1*xmin:] = rgb[:size+ymin, :size+xmin]
            elif ymin < 0 and xmax > origRGB.shape[1]:
                stamp[-1*ymin:, :size-(xmax-origRGB.shape[1])] = origRGB[:size+ymin, xmin:]
                bcgsOutStamp[-1*ymin:, :size-(xmax-origRGB.shape[1])] = rgb[:size+ymin, xmin:]
            elif ymax > origRGB.shape[0] and xmin < 0:
                stamp[:size-(ymax-origRGB.shape[0]):, -1*xmin:] = origRGB[ymin:, :size+xmin]
                bcgsOutStamp[:size-(ymax-origRGB.shape[0]):, -1*xmin:] = rgb[ymin:, :size+xmin]
            elif ymax > origRGB.shape[0] and xmax > origRGB.shape[1]:
                stamp[:size-(ymax-origRGB.shape[0]):, :size-(xmax-origRGB.shape[1])] = origRGB[ymin:, xmin:]
                bcgsOutStamp[:size-(ymax-origRGB.shape[0]):, :size-(xmax-origRGB.shape[1])] = rgb[ymin:, xmin:]
            elif ymin < 0:
                stamp[-1*ymin:, :] = origRGB[:size+ymin, xmin:xmax]
                bcgsOutStamp[-1*ymin:, :] = rgb[:size+ymin, xmin:xmax]
            elif ymax > origRGB.shape[0]:
                stamp[:size-(ymax-origRGB.shape[0]):, :] = origRGB[ymin:, xmin:xmax]
                bcgsOutStamp[:size-(ymax-origRGB.shape[0]):, :] = rgb[ymin:, xmin:xmax]
            elif xmin < 0:
                stamp[:, -1*xmin:] = origRGB[ymin:ymax, :size+xmin]
                bcgsOutStamp[:, -1*xmin:] = rgb[ymin:ymax, :size+xmin]
            elif xmax > origRGB.shape[0]:
                stamp[:, :size-(xmax-origRGB.shape[1])] = origRGB[ymin:ymax, xmin:]
                bcgsOutStamp[:, :size-(xmax-origRGB.shape[1])] = rgb[ymin:ymax, xmin:]
            else:
                stamp[:] = origRGB[ymin:ymax, xmin:xmax]
                bcgsOutStamp[:] = rgb[ymin:ymax, xmin:xmax]

            # adjust brightness of stamp
            if b != 1:
                stamp = stamp * b
                stamp[np.where(stamp > 255)] = 255
                bcgsOutStamp = bcgsOutStamp * b
                bcgsOutStamp[np.where(bcgsOutStamp > 255)] = 255

            # set 1" scale bar
            scaleBarSize = int(np.round(1./pixscl))
            stamp[r+scaleBarSize:r+2*scaleBarSize, r:r+1] = (0, 255, 0)
            stamp[r:r+1, r-2*scaleBarSize:r-scaleBarSize] = (0, 255, 0)
            bcgsOutStamp[r+scaleBarSize:r+2*scaleBarSize, r:r+1] = (0, 255, 0)
            bcgsOutStamp[r:r+1, r-2*scaleBarSize:r-scaleBarSize] = (0, 255, 0)

            # add border
            stamp[0:, 0] = [0, 0, 0]
            stamp[0:, -1] = [0, 0, 0]
            stamp[0, 0:] = [0, 0, 0]
            stamp[-1, 0:] = [0, 0, 0]
            bcgsOutStamp[0:, 0] = [0, 0, 0]
            bcgsOutStamp[0:, -1] = [0, 0, 0]
            bcgsOutStamp[0, 0:] = [0, 0, 0]
            bcgsOutStamp[-1, 0:] = [0, 0, 0]

            # save cutout
            fileName = '%sFFweb/%s/object_cutouts/%s/%i_%s_rgb.%s' %(mainDir, fName, index, id, filterSet, saveExt)
            misc.imsave(fileName, stamp)
            bcgsOutFileName = '%sFFweb/%s/object_cutouts/%s/%i_%s_bcgs_out_rgb.%s' %(mainDir, fName, index, id, filterSet, saveExt)
            misc.imsave(bcgsOutFileName, bcgsOutStamp)
            
            if filterSet != 'det':
                if filterSet == 'acs':
                    message = 'F435W F606W F814W'
                elif filterSet == 'ijh':
                    message = 'F814W F125W F160W'
                elif filterSet == 'ijk':
                    message = 'F814W F105W+F125W Ks'
                stamp = Image.open(fileName)
                stamp = stamp.resize((1000, 1000))
                draw = ImageDraw.Draw(stamp)
                font = ImageFont.truetype('%sFFweb/arial.ttf' %(mainDir), size=60)
                color = 'rgb(255, 255, 255)'
                (x, y) = (30, 910)
                draw.text((x, y), message, fill=color, font=font)
                draw2 = ImageDraw.Draw(stamp)
                if filterSet == 'acs':
                    font = ImageFont.truetype('%sFFweb/arial.ttf' %(mainDir), size=60)
                    draw2.text((396, 512), '1"', fill='rgb(0, 255, 0)', font=font)
                #elif filterSet == 'ijk':
                #    font = ImageFont.truetype('%sFFweb/arial.ttf' %(mainDir), size=30)
                #    draw2.text((435, 510), '1"', fill='rgb(0, 255, 0)', font=font)
                stamp.save(fileName)
                stamp.close()
                stamp = Image.open(bcgsOutFileName)
                stamp = stamp.resize((1000, 1000))
                draw = ImageDraw.Draw(stamp)
                font = ImageFont.truetype('%sFFweb/arial.ttf' %(mainDir), size=60)
                color = 'rgb(255, 255, 255)'
                (x, y) = (30, 910)
                draw.text((x, y), message, fill=color, font=font)
                #draw2 = ImageDraw.Draw(stamp)
                #if filterSet == 'acs':
                #    font = ImageFont.truetype('%sFFweb/arial.ttf' %(mainDir), size=55)
                #    draw2.text((400, 512), '1"', fill='rgb(0, 255, 0)', font=font)
                #elif filterSet == 'ijk':
                #    font = ImageFont.truetype('%sFFweb/arial.ttf' %(mainDir), size=40)
                #    draw2.text((422, 510), '1"', fill='rgb(0, 255, 0)', font=font)
                stamp.save(bcgsOutFileName)
                stamp.close()

def ffaddz(field, size=251, pixscl=0.06, filterSet='ijh', saveExt='png', startID=1, endID=20100, zlim=15):
    if ('par' not in field) and ('clu' not in field): field = field + 'clu'
    
    if 'abell' in field:
        if 'clu' in field:
            fName = 'A%s-clu' %((field.replace('clu','')).replace('abell',''))
        elif 'par' in field:
            fName = 'A%s-par' %((field.replace('par','')).replace('abell',''))
    elif 'macs' in field:
        if 'clu' in field:
            fName = 'M%s-clu' %((field.replace('clu','')).replace('macs',''))
        elif 'par' in field:
            fName = 'M%s-par' %((field.replace('par','')).replace('macs',''))
    
    catName = glob.glob('%sRelease/%s/catalogs/hffds_%s_v*.cat' %(mainDir, field.replace('clu',''), field))[-1]
    cat = table.read(catName, format='ascii')
    zoutName = '%sRelease/%s/catalogs/eazy/%s_v3.9/%s_v3.9.zout' %(mainDir, field.replace('clu',''), field, field)
    zout = astropy.table.Table.read(zoutName, format='ascii')
    segName = glob.glob('%sRelease/%s/photometry/%s_bcgs_out_detection_seg.fits*' %(mainDir, field.replace('clu',''), field.replace('clu','')))[0]
    seg = pyfits.getdata(segName)
    ids = range(startID, endID)
    for id in ids:
        if id in cat['id'] and id < 20000:
            print()
            print unicorn.noNewLine+'%d' %(id)
            # rgb cutouts are 1000x1000 when saved
            conv = int(np.round(1000./size))
            # pixels per arcsec
            ppa = int(np.round(1./pixscl))
            
            index = str((id/100)*100)
            fileName = '%sFFweb/%s/object_cutouts/%s/%i_%s_rgb.%s' %(mainDir, fName, index, id, filterSet, saveExt)
            x = cat['x'][cat['id'] == id]
            y = cat['y'][cat['id'] == id]
            r = (size-1)/2
            xmin, xmax, ymin, ymax = int(np.round(x-r)), int(np.round(x+r))+1, int(np.round(y-r)), int(np.round(y+r))+1
            seg_cutout = seg[ymin:ymax,xmin:xmax]
            cids = np.unique(seg_cutout)[1:]
            cutout_ids = []
            mags = []
            for cid in cids:
                cx = cat['x'][cat['id'] == cid][0]
                cy = cat['y'][cat['id'] == cid][0]
                cm814 = -2.5*np.log10(cat['f_F814W'][cat['id'] == cid])+25.
                cm160 = -2.5*np.log10(cat['f_F160W'][cat['id'] == cid])+25.
                cmag = np.nanmin([cm814, cm160])
                if (cid != id) & (cat['use_phot'][cat['id'] == cid] == 1) & (cx > xmin+ppa) & (cx < xmax-ppa) & (cy > ymin+ppa) & (cy < ymax-ppa) & (cmag == cmag):
                    if zout['z_spec'][zout['id'] == cid] != -1:
                        cutout_ids = [cid]+cutout_ids
                        mags = [0]+mags
                    elif zout['z_peak'][zout['id'] == cid] != -99:
                        if len(cutout_ids) == 0:
                            cutout_ids.append(cid)
                            mags.append(cmag)
                        else:
                            added = False
                            i = 0
                            while not added:
                                if cmag < mags[i]:
                                    cutout_ids = cutout_ids[:i] + [cid] + cutout_ids[i:]
                                    mags = mags[:i] + [cmag] + mags[i:]
                                    added = True
                                elif i == len(cutout_ids)-1:
                                    cutout_ids = cutout_ids + [cid]
                                    mags = mags + [cmag]
                                    added = True
                                i += 1
            if len(cutout_ids) > zlim:
                cutout_ids = cutout_ids[:zlim]
            stamp = Image.open(fileName)
            for cutout_id in cutout_ids:
                cx = cat['x'][cat['id'] == cutout_id]
                cy = cat['y'][cat['id'] == cutout_id]
                if zout['z_spec'][zout['id'] == cutout_id] != -1:
                    cz = zout['z_spec'][zout['id'] == cutout_id]
                    color = '#CC0000'
                else:
                    cz = zout['z_peak'][zout['id'] == cutout_id]
                    color = '#00CC00'
                message = '%.2f' %(cz)
                draw = ImageDraw.Draw(stamp)
                font = ImageFont.truetype('%sFFweb/arial.ttf' %(mainDir), size=40)
                # add z label 1/2" above each galaxy
                (x, y) = ((cx-xmin-ppa/4)*conv, 1000-(cy-ymin+2*ppa/3)*conv)
                draw.text((x, y), message, fill=color, font=font)
            stamp.save(fileName)
            stamp.close()


def ffStamps2(field, size=167, pixscl=0.06, saveExt='png', startID=1, endID=20100):
    """ Creates stamp cutouts from segmentation map and detection image for each catalog source.
    Also creates magnification map cutout from segmentation map.
    # Notes: misc.imread indexes arrays from the top left corner,
    # catalog "y" indexing is reversed, going from the bottom to the top.
    # field: field name
    # size: size of cutout (i.e. 167 x 167 pixels)
    # saveExt: "png", "jpg", etc.
    """

    # read in segmentation map and detection image
    if ('par' not in field) and ('clu' not in field): field = field + 'clu'
    
    if 'abell' in field:
        if 'clu' in field:
            fName = 'A%s-clu' %((field.replace('clu','')).replace('abell',''))
        elif 'par' in field:
            fName = 'A%s-par' %((field.replace('par','')).replace('abell',''))
    elif 'macs' in field:
        if 'clu' in field:
            fName = 'M%s-clu' %((field.replace('clu','')).replace('macs',''))
        elif 'par' in field:
            fName = 'M%s-par' %((field.replace('par','')).replace('macs',''))
    
    seg = pyfits.getdata(glob.glob('%sRelease/%s/photometry/%s_bcgs_out_detection_seg.fits*' %(mainDir, field.replace('clu',''), field.replace('clu','')))[0])
    seg = seg[::-1]

    # read in most recent catalog
    catName = glob.glob('%sRelease/%s/catalogs/hffds_%s_v*.cat' %(mainDir, field.replace('clu',''), field))[-1]
    version = str((catName.split('_v')[1]).split('.cat')[0])
    cat = table.read(catName, format='ascii')
    if 'clu' in field:
        magcat = table.read('%sMagnification_Catalogs/%s/%s_errmodels.lmf' %(mainDir, field, field), format='ascii')
        # magnification map colorbar
        magticks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        magrcolor = [255, 254, 253, 252, 226, 190, 151, 113, 75, 36, 0]
        maggcolor = [255, 204, 152, 101, 53, 8, 4, 2, 1, 0, 0]
        magbcolor = [255, 158, 64, 32, 25, 18, 12, 6, 3, 1, 0]
        magrf = scipy.interpolate.interp1d(magticks, magrcolor, kind='cubic')
        maggf = scipy.interpolate.interp1d(magticks, maggcolor, kind='cubic')
        magbf = scipy.interpolate.interp1d(magticks, magbcolor, kind='cubic')

    # pixel size should be an odd number so that source is centered
    r = (size-1)/2
    # create cutouts for each catalog source
    ids = range(startID, endID)
    for id in ids:
        if id in cat['id'] and id < 20000:
            print()
            print unicorn.noNewLine+'%d' %(id)
            segstamp = np.ones((size, size, 3), dtype='int') * 255
            magstamp = np.ones((size, size, 3), dtype='int') * 255
            if 'clu' in field:
                if field == 'macs0416clu':
                    model = 'model3_b'
                else:
                    model = 'model2_b'
                mags = magcat[model]
            else:
                mags = np.ones(len(cat)) * -1
            tempstamp = np.zeros((size, size), dtype='int')
            index = str((id/100)*100)
            i = np.where(cat['id'] == id)[0][0]
            x = int(np.round(cat['x'][i]))
            xmin = x-r
            xmax = x+r+1
            y = int(np.round(cat['y'][i]))
            ymin = seg.shape[0]-(y+r+1)
            ymax = seg.shape[0]-(y-r)
            # check if cutout contains pixels outside of image bounds
            if ymin < 0 and xmin < 0:
                tempstamp[-1*ymin:, -1*xmin:] = seg[:size+ymin, :size+xmin]
            elif ymin < 0 and xmax > seg.shape[1]:
                tempstamp[-1*ymin:, :size-(xmax-seg.shape[1])] = seg[:size+ymin, xmin:]
            elif ymax > seg.shape[0] and xmin < 0:
                tempstamp[:size-(ymax-seg.shape[0]):, -1*xmin:] = seg[ymin:, :size+xmin]
            elif ymax > seg.shape[0] and xmax > seg.shape[1]:
                tempstamp[:size-(ymax-seg.shape[0]):, :size-(xmax-seg.shape[1])] = seg[ymin:, xmin:]
            elif ymin < 0:
                tempstamp[-1*ymin:, :] = seg[:size+ymin, xmin:xmax]
            elif ymax > seg.shape[0]:
                tempstamp[:size-(ymax-seg.shape[0]):, :] = seg[ymin:, xmin:xmax]
            elif xmin < 0:
                tempstamp[:, -1*xmin:] = seg[ymin:ymax, :size+xmin]
            elif xmax > seg.shape[0]:
                tempstamp[:, :size-(xmax-seg.shape[1])] = seg[ymin:ymax, xmin:]
            else:
                tempstamp[:] = seg[ymin:ymax, xmin:xmax]

            segIDs = np.unique(tempstamp)[1:]
            colors = np.ones((len(segIDs), 3))
            for c in range(len(colors)):
                while(np.sum(colors[c]) < 255):
                    colors[c][0] = np.random.randint(50, 250)
                    colors[c][1] = np.random.randint(50, 250)
                    colors[c][2] = np.random.randint(50, 250)
            
            for i in range(len(segIDs)):
                # make segmentation region of central source black
                if segIDs[i] == id:
                    color = [0, 0, 0]
                else:
                    color = list(colors[i])
                segstamp[np.where(tempstamp == segIDs[i])] = color
                
                # magnification color gray if value less than zero
                if 'clu' in field:
                    mag = mags[magcat['id'] == segIDs[i]][0]
                    if mag < 0:
                        magstamp[np.where(tempstamp == segIDs[i])] = [200, 200, 200]
                    elif mag >= 10:
                        magstamp[np.where(tempstamp == segIDs[i])] = [0, 0, 0]
                    elif mag >= 0:
                        magstamp[np.where(tempstamp == segIDs[i])] = [int(np.round(magrf(mag))), int(np.round(maggf(mag))), int(np.round(magbf(mag)))]
                else:
                    magstamp[np.where(tempstamp == segIDs[i])] = [200, 200, 200]

            # add border
            segstamp[0:, 0] = [0, 0, 0]
            segstamp[0:, -1] = [0, 0, 0]
            segstamp[0, 0:] = [0, 0, 0]
            segstamp[-1, 0:] = [0, 0, 0]
            magstamp[0:, 0] = [0, 0, 0]
            magstamp[0:, -1] = [0, 0, 0]
            magstamp[0, 0:] = [0, 0, 0]
            magstamp[-1, 0:] = [0, 0, 0]

            # save cutouts
            segFileName = '%sFFweb/%s/object_cutouts/%s/%i_seg.%s' %(mainDir, fName, index, id, saveExt)
            misc.imsave(segFileName, segstamp)
            magFileName = '%sFFweb/%s/object_cutouts/%s/%i_mag.%s' %(mainDir, fName, index, id, saveExt)
            misc.imsave(magFileName, magstamp)

            # resize pngs
            stamp = Image.open(segFileName)
            stamp = stamp.resize((1000, 1000))
            stamp.save(segFileName)
            stamp.close()
            stamp = Image.open(magFileName)
            stamp = stamp.resize((1000, 1000))
            stamp.save(magFileName)
            stamp.close()


def ffgen(field, startID=1, endID=20100, websiteReady=True):
    # creates an HTML file for each catalog entry
    # cat1=.cat, cat2=.zout, cat3=.fout, cat4=sfr, cat5=153, cat6=155, cat7=161, cat8=agn cat9=zspec

    if ('par' not in field) and ('clu' not in field): field = field + '-clu'

    if 'abell' in field:
        if 'clu' in field:
            fName = 'A%s-clu' %((field.replace('clu','')).replace('abell',''))
        elif 'par' in field:
            fName = 'A%s-par' %((field.replace('par','')).replace('abell',''))
    elif 'macs' in field:
        if 'clu' in field:
            fName = 'M%s-clu' %((field.replace('clu','')).replace('macs',''))
        elif 'par' in field:
            fName = 'M%s-par' %((field.replace('par','')).replace('macs',''))

    catName = glob.glob('%sRelease/%s/catalogs/hffds_%s_v*.cat' %(mainDir, field.replace('clu',''), field))[-1]
    version = str((catName.split('_v')[1]).split('.cat')[0])
    cat1 = table.read(catName, format='ascii')
    cat2 = table.read('%sRelease/%s/catalogs/eazy/%s_v%s/%s_v%s.zout' %(mainDir, field.replace('clu',''), field, version, field, version), format='ascii')
    cat3 = table.read('%sRelease/%s/catalogs/fast/%s_v%s/%s_v%s.fout' %(mainDir, field.replace('clu',''), field, version, field, version), format='ascii', header_start=17)
    cat5 = table.read('%sRelease/%s/catalogs/eazy/%s_v%s/%s_v%s.153.rf' %(mainDir, field.replace('clu',''), field, version, field, version), format='ascii')
    cat6 = table.read('%sRelease/%s/catalogs/eazy/%s_v%s/%s_v%s.155.rf' %(mainDir, field.replace('clu',''), field, version, field, version), format='ascii')
    cat7 = table.read('%sRelease/%s/catalogs/eazy/%s_v%s/%s_v%s.161.rf' %(mainDir, field.replace('clu',''), field, version, field, version), format='ascii')

    ids = range(startID, endID)
    for id in ids:  #numpy is 0 indexed, so we need the index to be one less than the object number
        if id in cat1['id']:
            objnum = id #number of the object as an integer
            i = np.where(cat1['id'] == id)[0][0]
            index = str((objnum/100)*100)  #pulls 100s place
            if i == 0:
                nextID = cat1['id'][i+1]
                nextObj = str(nextID)
                nextIndex = str((nextID/100)*100)
            elif i == len(cat1)-1:
                prevID = cat1['id'][i-1]
                prevObj = str(prevID)
                prevIndex = str((prevID/100)*100)
            else:
                prevID = cat1['id'][i-1]
                prevObj = str(prevID)
                prevIndex = str((prevID/100)*100)
                nextID = cat1['id'][i+1]
                nextObj = str(nextID)
                nextIndex = str((nextID/100)*100)
            if websiteReady:
                try:
                    os.stat('%sWebsite/HFFexplorer/%s/object_pages/%s/' %(mainDir, fName, index)) #creates each subdirectory
                except:
                    os.mkdir('%sWebsite/HFFexplorer/%s/object_pages/%s/' %(mainDir, fName, index))
                obj = str(objnum) #object number as a string
                name = '%sWebsite/HFFexplorer/%s/object_pages/%s/%s.html' %(mainDir, fName, index, obj) #sets name of the file to be created
                f = open(name,'w') #creates html file
                fmini = open(name.replace('.html', 'mini.html'), 'w')
            else:
                try:
                    os.stat('%sFFweb/%s/object_pages/%s/' %(mainDir, fName, index)) #creates each subdirectory
                except:
                    os.mkdir('%sFFweb/%s/object_pages/%s/' %(mainDir, fName, index))
                obj = str(objnum) #object number as a string
                name = '%sFFweb/%s/object_pages/%s/%s.html' %(mainDir, fName, index, obj) #sets name of the file to be created
                f = open(name,'w') #creates html file
                fmini = open(name.replace('.html', 'mini.html'), 'w')

            f.write('<!DOCTYPE html>\n<html>\n<title>HFFDS | '+fName+': '+obj+'</title>\n<link rel="shortcut icon" type="image/png" href="http://cosmos.phy.tufts.edu/~danilo/HFF/HFFexplorer/HFFDS-icon2.png">\n<head>\n<style>\ntable, th, td {\nborder: 1px solid black;\n}\nbody {\nfont-family: Helvetica;\ncolor: #222222;\n}\n')
            fmini.write('<!DOCTYPE html>\n<html>\n<title>HFFDS | '+fName+': '+obj+'</title>\n<link rel="shortcut icon" type="image/png" href="http://cosmos.phy.tufts.edu/~danilo/HFF/HFFexplorer/HFFDS-icon2.png">\n<head>\n<style>\n@font-face {\nfont-family: "Open Sans";\nfont-style: normal;\nfont-weight: 300;\nsrc: local("Open Sans Light"), local("OpenSans-Light"), url(https://fonts.gstatic.com/s/opensans/v13/DXI1ORHCpsQm3Vp6mXoaTeY5mlVXtdNkpsMpKkrDXP4.woff) format("woff");\n}\n</style><style>\nbody{\nfont-family: Open Sans;\nfont-weight: normal;\ncolor: #222222;\nfont-size: 108%\n}\n</style>\n</head>\n<body>\n')

            if i == 0:
                f.write('.prev {\ntext-decoration: none;\ndisplay: inline;\ntext-align: center;\nfont-size: 20px;\nbackground-color: gray;\ncolor: white;\npadding: 2px 16px;\nborder-radius: 4px;\n}\n.next {\ntext-decoration: none;\ndisplay: inline;\ntext-align: center;\nfont-size: 20px;\nbackground-color: black;\ncolor: white;\npadding: 2px 30px;\nborder-radius: 4px;\ntransition-duration: 100ms;\n}\n.next:hover {\nbackground-color: gray;\ncolor: white;\n}')
            elif i == len(cat1)-1:
                f.write('.prev {\ntext-decoration: none;\ndisplay: inline;\ntext-align: center;\nfont-size: 20px;\nbackground-color: black;\ncolor: white;\npadding: 2px 16px;\nborder-radius: 4px;\n}\n.prev:hover {\nbackground-color: gray;\ncolor: white;\n}\n.next {\ntext-decoration: none;\ndisplay: inline;\ntext-align: center;\nfont-size: 20px;\nbackground-color: gray;\ncolor: white;\npadding: 2px 30px;\nborder-radius: 4px;\ntransition-duration: 100ms;\n}\n')
            else:
                f.write('.prev {\ntext-decoration: none;\ndisplay: inline;\ntext-align: center;\nfont-size: 20px;\nbackground-color: black;\ncolor: white;\npadding: 2px 16px;\nborder-radius: 4px;\n}\n.prev:hover {\nbackground-color: gray;\ncolor: white;\n}\n.next {\ntext-decoration: none;\ndisplay: inline;\ntext-align: center;\nfont-size: 20px;\nbackground-color: black;\ncolor: white;\npadding: 2px 30px;\nborder-radius: 4px;\ntransition-duration: 100ms;\n}\n.next:hover {\nbackground-color: gray;\ncolor: white;\n}\n')

            f.write('</style>\n</head>\n<body>\n<div style="position: relative; width:100%;">\n<h2 style="margin-top: 15px; font-weight: lighter;">&nbsp;&nbsp;'+fName+'&nbsp;&nbsp;&nbsp;Object ID: '+obj)
            
            if websiteReady:
                if i == 0:
                    f.write('<a href="http://cosmos.phy.tufts.edu/~danilo/HFF/HFFexplorer/'+fName+'/object_pages/'+nextIndex+'/'+nextObj+'.html" class="next" style="margin-top: 1px; float: right; margin-right: 12px;">Next</a><a class="prev" style="margin-top:1px; float: right; margin-right: 7px;">Previous</a></h2>\n')
                elif i == len(cat1)-1:
                    f.write('<a class="next" style="margin-top: 1px; float: right; margin-right: 12px;">Next</a><a href="http://cosmos.phy.tufts.edu/~danilo/HFF/HFFexplorer/'+fName+'/object_pages/'+prevIndex+'/'+prevObj+'.html" class="prev" style="margin-top:1px; float: right; margin-right: 7px;">Previous</a></h2>\n')
                else:
                    f.write('<a href="http://cosmos.phy.tufts.edu/~danilo/HFF/HFFexplorer/'+fName+'/object_pages/'+nextIndex+'/'+nextObj+'.html" class="next" style="margin-top: 1px; float: right; margin-right: 12px;">Next</a><a href="http://cosmos.phy.tufts.edu/~danilo/HFF/HFFexplorer/'+fName+'/object_pages/'+prevIndex+'/'+prevObj+'.html" class="prev" style="margin-top: 1px; float: right; margin-right: 7px;">Previous</a></h2>\n')
            else:
                if i == 0:
                    f.write('<a href="/Users/hff/HAWKI/FFweb/'+fName+'/object_pages/'+nextIndex+'/'+nextObj+'.html" class="next" style="margin-top: 1px; float: right; margin-right: 12px;">Next</a><a class="prev" style="margin-top:1px; float: right; margin-right: 7px;">Previous</a></h2>\n')
                elif i == len(cat1)-1:
                    f.write('<a class="next" style="margin-top: 1px; float: right; margin-right: 12px;">Next</a><a href="/Users/hff/HAWKI/FFweb/'+fName+'/object_pages/'+prevIndex+'/'+prevObj+'.html" class="prev" style="margin-top: 1px; float: right; margin-right: 7px;">Previous</a></h2>\n')
                else:
                    f.write('<a href="/Users/hff/HAWKI/FFweb/'+fName+'/object_pages/'+prevIndex+'/'+prevObj+'.html" class="next" style="margin-top: 1px; float: right; margin-right: 12px;">Next</a><a href="/Users/hff/HAWKI/FFweb/'+fName+'/object_pages/'+nextIndex+'/'+nextObj+'.html" class="prev" style="margin-top: 1px; float: right; margin-right: 7px;">Previous</a></h2>\n')
            f.write('</div>\n')

            X = str(round(cat1['x'][i], 1))   #parameters from catalogs as strings
            Y = str(round(cat1['y'][i], 1))
            RA = cat1['ra'][i]
            RA = '%.5f' %(RA)
            DEC = cat1['dec'][i]
            DEC = '%.5f' %(DEC)
            f160 = cat1['f_F160W'][i]   #as a float, since used in math
            f814 = cat1['f_F814W'][i]
            star = str(int(cat1['star_flag'][i]))
            z_peak = str(round(cat2['z_peak'][i], 2))
            if z_peak == '-99.0':
                z_peak = '-99'
            use = str(int(cat1['use_phot'][i]))
            zspec = cat2['z_spec'][i]
            if zspec > 0:
                z_spec = str(round(zspec, 2))
            else:
                z_spec = '-99' #removes zspecs less than 0
            sfr = cat3['lsfr'][i]
            mass = cat3['lmass'][i]
            ssfr = cat3['lssfr'][i]
            if ssfr == -1:
                ssfr = '-99'
            elif np.isnan(ssfr):
                ssfr = '-99'
            else:
                ssfr = str(ssfr)
            if mass == -1:
                mass = '-99'  #removes bad values
            elif np.isnan(mass):  #removes bad values
                mass = '-99'
            else:
                mass = str(mass)
            if str(sfr) == '-1.0':    #removes bad values
                sfr = '-99'
            elif np.isnan(sfr): #removes bad values
                sfr = '-99'
            else:
                sfr = str(sfr)
            agn = 'No'
            U = cat5['L153'][i]  #floats
            Udm = cat5['DM'][i]
            V = cat6['L155'][i]
            Vdm = cat6['DM'][i]
            J = cat7['L161'][i]
            Jdm = cat7['DM'][i]
            if (U>0) & (V>0):
                UV_rest = (-2.5 * np.log10(U) + 25. - Udm) - (-2.5 * np.log10(V) + 25. - Vdm)  #converts to mag
                UV = str(round(UV_rest, 2))  #color as a string
            else:
                UV = '-99' #removes bad values
            if (V>0) & (J>0):
                VJ_rest = (-2.5 * np.log10(V) + 25. - Vdm) - (-2.5 * np.log10(J) + 25. - Jdm) #converts to mag
                VJ = str(round(VJ_rest, 2))
            else:
                VJ = '-99' #removes bad values
            if f160 > 0:
                mag160 = str(round(-2.5 * np.log10(f160) + 25., 2)) #mag_K as a string
            else:
                mag160 = '-99' #removes bad values
            if f814 > 0:
                mag814 = str(round(-2.5 * np.log10(f814) + 25., 2))
            else:
                mag814 = '-99'  #removes bad values

            if websiteReady:
                picname = 'http://cosmos.phy.tufts.edu/~danilo/HFF/HFFexplorer/%s/object_figs/%s/%s.png' %(fName, index, obj)
            else:
                picname = '%sFFweb/%s/object_figs/%s/%s.png' %(mainDir, fName, index, obj) #name of picture associated with object
                picexists = os.path.isfile(picname) #checks if picture exists
            
            b = '<table align="center" style="font-weight: lighter; position: absolute; top: 55px; width: 98.5%; height: 200px">\n<tr>\n<td style="width: 15%"><b>&nbsp;&nbsp;X (pixels)</b></td><td style="width: 10%">&nbsp;'+X+'</td><td style="width: 15%"><b>&nbsp;&nbsp;RA (degree)</b></td><td style="width: 10%">&nbsp;'+RA+'</td><td style="width: 15%"><b>&nbsp;&nbsp;Use Flag</b></td><td style="width: 10%">&nbsp;'+use+'</td><td style="width: 15%"><b>&nbsp;&nbsp;log(M<sub>&#x2609;</sub>)</b></td><td style="width: 10%">&nbsp;'+mass+'</td></tr>' + '\n<tr><td style="width: 15%"><b>&nbsp;&nbsp;Y (pixels)</b></td><td style="width: 10%">&nbsp;'+Y+'</td><td style="width: 15%"><b>&nbsp;&nbsp;DEC (degree)</b></td><td style="width: 10%">&nbsp;'+DEC+'</td><td style="width: 15%"><b>&nbsp;&nbsp;Star Flag</b></td><td style="width: 10%">&nbsp;'+star+'</td><td style="width: 15%"><b>&nbsp;&nbsp;log(SFR)</b></td><td style="width: 10%">&nbsp;'+sfr+'</td></tr>' + '\n<tr><td style="width: 15%"><b>&nbsp;&nbsp;mag<sub>F814W</sub>&nbsp;(AB)</b></td><td style="width: 10%">&nbsp;'+mag814+'</td><td style="width: 15%"><b>&nbsp;&nbsp;z<sub>phot</sub></b></td><td style="width: 10%">&nbsp;'+z_peak+'</td><td style="width: 15%"><b>&nbsp;&nbsp;U-V<sub>Rest</sub>&nbsp;(AB)</b></td><td style="width: 10%">&nbsp;'+UV+'</td><td style="width: 15%"><b>&nbsp;&nbsp;log(sSFR)</b></td><td style="width: 10%">&nbsp;'+ssfr+'</td></tr>\n<tr><td style="width: 15%"><b>&nbsp;&nbsp;mag<sub>F160W</sub>&nbsp;(AB)</b></td><td style="width: 10%">&nbsp;'+mag160+'</td><td style="width: 15%"><b>&nbsp;&nbsp;z<sub>spec</sub></b></td><td style="width: 10%">&nbsp;'+z_spec+'</td><td style="width: 15%"><b>&nbsp;&nbsp;V-J<sub>Rest</sub>&nbsp;(AB)</b></td><td style="width: 10%">&nbsp;'+VJ+'</td><td style="width: 15%"><b>&nbsp;&nbsp;AGN Flag</b></td><td style="width: 10%">&nbsp;N/A</td></tr></table>\n' #creates html table
            end = '\n</body>\n</html>' #end of html
            if websiteReady:
                pic = '<div align="left" style="position: absolute; top: 265px;"><a class="brand" id="logo" href="'+picname+'"><img src="'+picname+'" width="99%"></a></br><h4 style="font-weight: lighter; margin-left: 5px;margin-top: -2px;">These values are for inspection only. For scientific studies, please <a style="text-decoration: none;" href="http://cosmos.phy.tufts.edu/~danilo/HFF/Download.html">download</a> and use the catalogs.</h4></div>'
                f.write(b+pic+end)
            else:
                if picexists:  #adds picture to file if it exist
                    pic = '<div align="left" style="position: absolute; top: 265px;"><a class="brand" id="logo" href="'+picname+'"><img src="'+picname+'" width="99%"></a></br><h4 style="font-weight: lighter; margin-left: 5px;margin-top: -2px;">These values are for inspection only. For scientific studies, please <a style="text-decoration: none;" href="http://cosmos.phy.tufts.edu/~danilo/HFF/Download.html">download</a> and use the catalogs.</h4></div>'
                    f.write(b+pic+end)
                else:       #if no picture, file is just table
                    f.write(b+end)
            f.close()
            b = '<p>x, y: '+X+', '+Y+'</br>RA: '+RA+'</br>DEC: '+DEC+'</br>mag<sub>F814W</sub>&nbsp;(AB): '+mag814+'</br>mag<sub>F160W</sub>&nbsp;(AB): '+mag160+'</br>z<sub>phot</sub>: '+z_peak+'</br>z<sub>spec</sub>: '+z_spec+'</br>Use Flag: '+use+'</br>Star Flag: '+star+'</p>\n</body>\n</html>'
            fmini.write(b)
            fmini.close()

