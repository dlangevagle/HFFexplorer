import numpy as np
import glob
import eazyPy
from pylab import *
import astropy.table
import astropy.io.fits as pyfits
from astropy import wcs
import matplotlib.patches as patches
import os
import unicorn

mainDir = '/Users/hff/HAWKI/'
#mainDir = '/Users/daniellange/Documents/HFF/'

def figgen(field='', id=0, saveExt='png', startID=1, endID=21000, size=0), version='3.9':
    # cluster redshift
    if '2744' in field:
        plotname = 'A2744'
        zclu = 0.308
    elif '0416' in field:
        plotname = 'M0416'
        zclu = 0.396
    elif '0717' in field:
        plotname = 'M0717'
        zclu = 0.545
    elif '1149' in field:
        plotname = 'M1149'
        zclu = 0.543
    elif '1063' in field:
        plotname = 'A1063'
        zclu = 0.348
    elif '370' in field:
        plotname = 'A370'
        zclu = 0.375

    # rename cluster field with "clu" ending
    if ('par' not in field) & ('clu' not in field):
        field = field+'clu'

    if 'clu' in field:
        plotname = plotname+'-clu'
    else:
        plotname = plotname+'-par'

    bands = np.array(['f435w','f606w','f814w','f105w','f125w','f140w','f160w','Ks'])
    fname = np.array(['B', 'V', 'I', 'Y', 'J', 'JH', 'H', 'Ks'])
    zp = 25.
    fsed_scale = 1.e-19
    # read in catalogs
    cat = astropy.table.Table.read('%sRelease/%s/catalogs/hffds_%s_v%s.cat' %(mainDir, field.replace('clu', ''), field, version), format='ascii')
    zout = astropy.table.Table.read('%sRelease/%s/catalogs/eazy/%s_v%s/%s_v%s.zout' %(mainDir, field.replace('clu',''), field, field, version, version), format='ascii')
    fout = astropy.table.Table.read('%sRelease/%s/catalogs/fast/%s_v%s/%s_v%s.fout' %(mainDir, field.replace('clu',''), field, field, version, version), format='ascii', header_start=17)
    u153 = astropy.table.Table.read('%sRelease/%s/catalogs/eazy/%s_v%s/%s_v%s.153.rf' %(mainDir, field.replace('clu',''), field, field, version, version), format='ascii')
    v155 = astropy.table.Table.read('%sRelease/%s/catalogs/eazy/%s_v%s/%s_v%s.155.rf' %(mainDir, field.replace('clu',''), field, field, version, version), format='ascii')
    j161 = astropy.table.Table.read('%sRelease/%s/catalogs/eazy/%s_v%s/%s_v%s.161.rf' %(mainDir, field.replace('clu',''), field, field, version, version), format='ascii')

    # check if source id exists in catalog
    ids = range(startID, endID)
    for id in ids:
        if id in cat['id']:
            print(unicorn.noNewLine+'%d' %(id))
            try:
                os.stat('%sWebsite/HFFexplorer/%s/object_figs/%d/' %(mainDir, plotname, (id/100)*100))
            except:
                os.mkdir('%sWebsite/HFFexplorer/%s/object_figs/%d/' %(mainDir, plotname, (id/100)*100))
            m_u = -2.5 * np.log10(u153[u153['id'] == id]['L153']) + 25. -  u153[u153['id'] == id]['DM']
            m_v = -2.5 * np.log10(v155[v155['id'] == id]['L155']) + 25. -  v155[v155['id'] == id]['DM']
            m_j = -2.5 * np.log10(j161[j161['id'] == id]['L161']) + 25. -  j161[j161['id'] == id]['DM']
            u_v = m_u - m_v
            v_j = m_v - m_j
            outfile = '%s_v%s' %(field, version)
            outdir = '%sRelease/%s/catalogs/eazy/%s_v%s' %(mainDir, field.replace('clu',''), field, version)
            filtplot = []
            for x in range(len(cat.colnames)):
                if cat.colnames[x][:2] == 'f_':
                    filtplot.append(cat.colnames[x])
            bt    = cat['bandtotal']
            flux  = cat['f_%s' %bands[2].upper()]
            for x in range(bt.size):
                if (bt[x] != 'none') and (bt[x] != 'bcg'):
                    flux[x] = cat['f_%s' %(bt[x]).upper()][x]
            mab   = -2.5 * np.log10(flux) + zp
            zspec = zout['z_spec']
            zpeak = zout['z_peak']
            l68   = zout['l68']
            u68   = zout['u68']
            zgal  = np.array(zout['z_peak'])
            zgal[np.where(zspec > 0.)] = zspec[np.where(zspec > 0.)]
            zgal[np.where(zgal == -99)] = 0
            odds  = zout['odds']
            mass  = fout['lmass']
            age   = fout['lage']
            sfr   = fout['lsfr']
            fchi2 = fout['chi2']

            good = False
            if os.path.exists('%sFFweb/%s/object_seds/BEST_FITS/%s_v%s_%d.fit' %(mainDir, plotname, field, version, id)):
                gal_sed = np.loadtxt('%sFFweb/%s/object_seds/BEST_FITS/%s_v%s_%d.fit' %(mainDir, plotname, field, version, id))
                wl = gal_sed[:,0]
                flux = gal_sed[:,1]*fsed_scale
                good = True

            catIndex = np.where(cat['id'] == id)[0][0]

            lambdaz, temp_sed, lci, obs_sed, fobs, efobs = eazyPy.getEazySED(catIndex, MAIN_OUTPUT_FILE=outfile, OUTPUT_DIRECTORY=outdir, scale_flambda=1.e-19)
            zgrid, pzi, prior = eazyPy.getEazyPz(catIndex, MAIN_OUTPUT_FILE=outfile, OUTPUT_DIRECTORY=outdir, binaries=None, get_prior=True)

            uvis_lci = []
            uvis_fobs = []
            uvis_efobs = []
            hff_lci = []
            hff_fobs = []
            hff_efobs = []
            clash_lci = []
            clash_fobs = []
            clash_efobs = []
            ks_lci = []
            ks_fobs = []
            ks_efobs = []
            irac_lci = []
            irac_fobs = []
            irac_efobs = []

            for i in range(len(lci)):
                if fobs[i] != -99:
                    # UVIS bands
                    if int(lci[i]) < 4000:
                        uvis_lci.append(lci[i])
                        uvis_fobs.append(fobs[i])
                        uvis_efobs.append(efobs[i])
                    # HFF bands
                    elif (int(lci[i]) == 4328) | (int(lci[i]) == 5959) | (int(lci[i]) == 8084) | (int(lci[i]) == 10577) | (int(lci[i]) == 12500) | (int(lci[i]) == 13971) | (int(lci[i]) == 15418):
                        hff_lci.append(lci[i])
                        hff_fobs.append(fobs[i])
                        hff_efobs.append(efobs[i])
                    # CLASH bands
                    elif (int(lci[i]) == 4765) | (int(lci[i]) == 5373) | (int(lci[i]) == 6324) | (int(lci[i]) == 7704) | (int(lci[i]) == 9048) | (int(lci[i]) == 11623):
                        clash_lci.append(lci[i])
                        clash_fobs.append(fobs[i])
                        clash_efobs.append(efobs[i])
                    # Ks
                    elif (int(lci[i]) > 21000) & (int(lci[i]) < 22000):
                        ks_lci.append(lci[i])
                        ks_fobs.append(fobs[i])
                        ks_efobs.append(efobs[i])
                    # IRAC bands
                    elif int(lci[i]) > 30000:
                        irac_lci.append(lci[i])
                        irac_fobs.append(fobs[i])
                        irac_efobs.append(efobs[i])
                else:
                    obs_sed[i] = -99

            labelfs = 40
            tickfs = 40
            mssize = 25
            fig = plt.figure(figsize = (60, 20))

            # SED figure
            ax1 = fig.add_axes([0.02, 0.52, 0.29, 0.43])
            #plt.title('SED', fontsize=labelfs+3, y=1.02)
            if good:
                ax1.plot((lambdaz)/1e4, temp_sed, '-', color='#A0A0A0', lw=2, label='EAZY', zorder=1)
                ax1.plot(wl/1e4, flux/fsed_scale, '-', color='black', lw=2, label='FAST', zorder=4)
            symbol = 'o'
            #if cat['star_flag'][cat['id'] == id] == 1:
            #    symbol = '*'
            #    mssize = 35
            if uvis_lci != []:
                # purple
                ax1.errorbar(np.array(uvis_lci)/1e4, uvis_fobs, yerr=uvis_efobs, fmt=symbol, ms=mssize, mew=2., elinewidth=1.5, mfc='#B266FF', mec='#6600CC', ecolor='#6600CC', clip_on=True, label='UVIS', zorder=5)
            if clash_lci != []:
                # green
                ax1.errorbar(np.array(clash_lci)/1e4, clash_fobs, yerr=clash_efobs, fmt=symbol, ms=mssize, mew=2., elinewidth=1.5, mfc='#33FF33', mec='#00CC00', ecolor='#00CC00', clip_on=True, label='CLASH', zorder=5)
            if hff_lci != []:
                # blue
                ax1.errorbar(np.array(hff_lci)/1e4, hff_fobs, yerr=hff_efobs, fmt=symbol, ms=mssize, mew=2., elinewidth=1.5, mfc='#3399FF', mec='#0000CC', ecolor='#0000CC', clip_on=True, label='HFF', zorder=5)
            if ks_lci != []:
                # orange
                ax1.errorbar(np.array(ks_lci)/1e4, ks_fobs, yerr=ks_efobs, fmt=symbol, ms=mssize, mew=2., elinewidth=1.5, mfc='#FFB266', mec='#FF8000', ecolor='#FF8000', clip_on=True, label='Ks', zorder=5)
            if irac_lci != []:
                # red
                ax1.errorbar(np.array(irac_lci)/1e4, irac_fobs, yerr=irac_efobs, fmt=symbol, ms=mssize, mew=2., elinewidth=1.5, mfc='#FF6666', mec='#CC0000', ecolor='#CC0000', clip_on=True, label='IRAC', zorder=5)
            if good:
                #ax1.scatter((lci)/1e4, obs_sed, s=mssize*10, marker=symbol, facecolors='#A0A0A0', edgecolor='#A0A0A0', lw=2., zorder=3)
                ax1.scatter((lci)/1e4, obs_sed, s=mssize*26, marker='o', facecolors='none', edgecolor='#505050', lw=10., zorder=2)
                ax1.scatter((lci)/1e4, obs_sed, s=mssize*26, marker='o', facecolors='none', edgecolor='#A0A0A0', lw=4., zorder=3)
                # maximum y value from hff bands, eazy bands, or fast template (past 0.225 microns)
                uvindex = 0
                while wl[uvindex] < 2250:
                    uvindex += 1
                fmax = np.nanmax(np.append(np.append(obs_sed, np.array(hff_fobs)), flux[uvindex:]/fsed_scale))
            elif hff_fobs != []:
                fmax = np.nanmax(hff_fobs)
            else:
                fmax = np.nanmax(fobs)
            ax1.set_xscale('log')
            ax1.set_xticks([0.2, 0.5, 1.0, 3.0])
            ax1.set_xticklabels([0.2, 0.5, 1.0, 3.0], fontsize=tickfs, y=-0.01)
            ax1.xaxis.set_tick_params(which='major', width=2, length=12)
            ax1.xaxis.set_tick_params(which='minor', width=1, length=6)
            #ax1.set_yticks(np.arange(0,ceil(fmax*1.5/100)*100.,ceil(fmax*1.5/100)*20.))
            ax1.set_yticklabels([], fontsize=tickfs)
            if zgal[cat['id'] == id] == 0:
                ax1.set_xlabel(r'Observed $\lambda$ ($\mu$m)', fontsize=labelfs)
                plt.text(1.175, fmax/10., 'No Fit', fontsize=labelfs)
            else:
                ax1.set_xlabel(r'Observed $\lambda$ ($\mu$m)', fontsize=labelfs)
            #ax1.set_ylabel(r'$f_{\lambda}$ ($\times 10^{-19}$erg s$^{-1}$ cm$^{-2}$ $\AA^{-1}$)', fontsize=labelfs)
            ax1.set_ylabel(r'$f_{\lambda}$', fontsize=labelfs)
            #ax1.legend(loc='upper right', numpoints=1, fontsize=32, frameon=False)
            ymax = fmax*1.25
            ax1.set_xlim(0.2,10.); ax1.set_ylim(0., ymax)
            if good:
                type = ''
                #print(u_v, v_j, (1.43*v_j - 0.36), 0.8*v_j)
                if cat['star_flag'][cat['id'] == id] == 1:
                    type = 'STAR'
                    tx = 1.22
                    tc = 'red'
                elif v_j < 0.75:
                    if u_v < 1.3:
                        if u_v < (1.43*v_j - 0.36):
                            type = 'dSF'
                            tx = 1.27
                            tc = 'orange'
                        else:
                            type = 'ndSF'
                            tx = 1.22
                            tc = 'blue'
                    else:
                        type = 'Q'
                        tx = 1.35
                        tc = 'red'
                elif v_j >= 0.75:
                    if u_v < (0.8*v_j+0.7):
                        if u_v < (1.43*v_j - 0.36):
                            type = 'dSF'
                            tx = 1.27
                            tc = 'orange'
                        else:
                            type = 'ndSF'
                            tx = 1.22
                            tc = 'blue'
                    else:
                        type = 'Q'
                        tx = 1.35
                        tc = 'red'
                plt.text(tx, fmax*1.135, type, color=tc, fontsize=labelfs)

                #ax1.scatter(4.85, fmax*1.165, s=mssize*10, marker=symbol, facecolors='#A0A0A0', edgecolor='#A0A0A0', lw=2., zorder=3)
                #if clash_fobs == []:
                #    ax1.scatter(5.95, fmax*1.165, s=mssize*40, marker='o', facecolors='none', edgecolor='#505050', lw=4., zorder=2)
                #    ax1.scatter(5.95, fmax*1.165, s=mssize*26, marker='o', facecolors='none', edgecolor='#A0A0A0', lw=4., zorder=3)
                #else:
                #    ax1.scatter(5.58, fmax*1.165, s=mssize*40, marker='o', facecolors='none', edgecolor='#505050', lw=4., zorder=2)
                #    ax1.scatter(5.58, fmax*1.165, s=mssize*26, marker='o', facecolors='none', edgecolor='#A0A0A0', lw=4., zorder=3)

            # source and stamp info
            plt.text(0.21, fmax*-0.38, '%s   Object ID: %d' %(plotname, id), color='black', fontsize=70)
            ty = -0.55
            dsize = 50
            plt.text(0.21, fmax*ty, 'Green indicators on stamps are 1" long and 1" away from source.', color='black', fontsize=dsize, )
            # RGB 1
            plt.text(0.21, fmax*(ty-0.125), 'RGB 1:', color='black', fontsize=dsize)
            plt.text(0.38, fmax*(ty-0.125), 'F814W', color='red', fontsize=dsize)
            plt.text(0.65, fmax*(ty-0.125), ', ', color='black', fontsize=dsize)
            plt.text(0.73, fmax*(ty-0.125), 'F606W', color='green', fontsize=dsize)
            plt.text(1.245, fmax*(ty-0.125), ', and ', color='black', fontsize=dsize)
            plt.text(1.95, fmax*(ty-0.125), 'F435W', color='blue', fontsize=dsize)
            if id < 20000:
                if size == 0:
                    plt.text(3.5, fmax*(ty-0.125), '(10" x 10")', color='black', fontsize=dsize)
                elif size == 1:
                    plt.text(3.5, fmax*(ty-0.125), '(15" x 15")', color='black', fontsize=dsize)
                elif size == 2:
                    plt.text(3.5, fmax*(ty-0.125), '(20" x 20")', color='black', fontsize=dsize)
            else:
                plt.text(3.5, fmax*(ty-0.125), '(20" x 20")', color='black', fontsize=dsize)
            # RGB 2
            plt.text(0.21, fmax*(ty-0.25), 'RGB 2: ', color='black', fontsize=dsize)
            plt.text(0.38, fmax*(ty-0.25), 'F160W', color='red', fontsize=dsize)
            plt.text(0.65, fmax*(ty-0.25), ', ', color='black', fontsize=dsize)
            plt.text(0.73, fmax*(ty-0.25), 'F125W', color='green', fontsize=dsize)
            plt.text(1.245, fmax*(ty-0.25), ', and ', color='black', fontsize=dsize)
            plt.text(1.95, fmax*(ty-0.25), 'F814W', color='blue', fontsize=dsize)
            if id < 20000:
                if (size == 0) | (size == 1):
                    plt.text(3.5, fmax*(ty-0.25), '(15" x 15")', color='black', fontsize=dsize)
                elif size == 2:
                    plt.text(3.5, fmax*(ty-0.25), '(20" x 20")', color='black', fontsize=dsize)
            else:
                plt.text(3.5, fmax*(ty-0.25), '(30" x 30")', color='black', fontsize=dsize)
            plt.text(0.38, fmax*(ty-0.375), r'Displayed numbers:', color='black', fontsize=dsize)
            plt.text(1.9, fmax*(ty-0.375), r'$z_{spec}$', color='red', fontsize=dsize)
            plt.text(2.7, fmax*(ty-0.375), 'or', color='black', fontsize=dsize)
            plt.text(3.25, fmax*(ty-0.375), r'$z_{peak}$', color='green', fontsize=dsize)
            plt.text(4.65, fmax*(ty-0.375), 'of neighboring sources.', color='black', fontsize=dsize)
            # RGB 3
            plt.text(0.21, fmax*(ty-0.5), 'RGB 3:', color='black', fontsize=dsize)
            plt.text(0.385, fmax*(ty-0.5), 'Ks', color='red', fontsize=dsize)
            plt.text(0.48, fmax*(ty-0.5), '(smoothed), ', color='black', fontsize=dsize)
            plt.text(1.3, fmax*(ty-0.5), 'F105W+F125W', color='green', fontsize=dsize)
            plt.text(4.4, fmax*(ty-0.5), ', and ', color='black', fontsize=dsize)
            plt.text(7.05, fmax*(ty-0.5), 'F814W', color='blue', fontsize=dsize)
            if id < 20000:
                if size == 2:
                    plt.text(12.25, fmax*(ty-0.5), '(20" x 20")', color='black', fontsize=dsize)
                else:
                    plt.text(12.25, fmax*(ty-0.5), '(15" x 15")', color='black', fontsize=dsize)
            else:
                plt.text(12.25, fmax*(ty-0.5), '(30" x 30")', color='black', fontsize=dsize)
            if id < 20000:
                # Detection Image & Segmentation Map
                if size == 0:
                    plt.text(0.21, fmax*(ty-0.625), 'Detection Image, Segmentation Map (10" x 10")', color='black', fontsize=dsize)
                elif size == 1:
                    plt.text(0.21, fmax*(ty-0.625), 'Detection Image, Segmentation Map (15" x 15")', color='black', fontsize=dsize)
                elif size == 2:
                    plt.text(0.21, fmax*(ty-0.625), 'Detection Image, Segmentation Map (20" x 20")', color='black', fontsize=dsize)
                # Magnification Map
                if size == 0:
                    plt.text(0.21, fmax*(ty-0.75), 'Magnification Map: Magnifications N/A for gray sources (10" x 10")', color='black', fontsize=dsize)
                elif size == 1:
                    plt.text(0.21, fmax*(ty-0.75), 'Magnification Map: Magnifications N/A for gray sources (15" x 15")', color='black', fontsize=dsize)
                elif size == 2:
                    plt.text(0.21, fmax*(ty-0.75), 'Magnification Map: Magnifications N/A for gray sources (20" x 20")', color='black', fontsize=dsize)


            #savefig('%sFFweb/%s/object_seds/%d/%d.eps' %(mainDir, field, (id/100)*100, id))

            # ZPDF figure
            ax2 = fig.add_axes([0.33, 0.52, 0.148, 0.43])
            plt.title('Redshift PDF', fontsize=labelfs+3, y=1.02)
            # plot cluster redshift
            ax2.plot([zclu, zclu], [0, pzi.max()], '-', color='#FF8000', lw=2)
            # check redshift uncertainty and plot hatched region
            uncertainty = np.where((zgrid > l68[cat['id'] == id]) & (zgrid < u68[cat['id'] == id]))[0]
            if len(uncertainty > 0):
                lslope = (pzi[uncertainty[0]]-pzi[uncertainty[0]-1])/(zgrid[uncertainty[0]]-zgrid[uncertainty[0]-1])
                ux = [l68[cat['id'] == id], l68[cat['id'] == id]]
                uy = [0, pzi[uncertainty[0]-1]+lslope*(l68[cat['id'] == id]-zgrid[uncertainty[0]-1])]
                for u in uncertainty:
                    ux.append(zgrid[u])
                    uy.append(pzi[u])
                uslope = (pzi[uncertainty[-1]+1]-pzi[uncertainty[-1]])/(zgrid[uncertainty[-1]+1]-zgrid[uncertainty[-1]])
                ux.append(u68[cat['id'] == id])
                ux.append(u68[cat['id'] == id])
                uy.append(pzi[uncertainty[-1]]+uslope*(u68[cat['id'] == id]-zgrid[uncertainty[-1]]))
                uy.append(0)
                polpts = []
                for i in range(len(ux)):
                    polpts.append([ux[i], uy[i]])
                ax2.add_patch(Polygon(polpts, edgecolor='#33FF33', closed=True, fill=False, hatch='\\\\'))
                ax2.plot(ux, uy, color='#00CC00')
            # plot photometric redshift
            lbound = (zpeak[cat['id'] == id]-l68[cat['id'] == id])
            ubound = (u68[cat['id'] == id]-zpeak[cat['id'] == id])
            z = zpeak[cat['id'] == id]
            if zgal[cat['id'] == id] == 0:
                ax2.plot([-1, -1], [-1, -1], '-', color='#00CC00', lw=2, label=r'$z_{peak}$ $=$ $-99$')
            elif lbound > 0:
                if ubound > 0:
                    ax2.plot([zpeak[cat['id'] == id], zpeak[cat['id'] == id]], [0, pzi.max()], '-', color='#00CC00', lw=2, label=r'$z_{peak}$ $=$ $%.3f^{+%.3f}_{-%.3f}$' %(zpeak[cat['id'] == id], ubound, lbound))
                else:
                    ax2.plot([zpeak[cat['id'] == id], zpeak[cat['id'] == id]], [0, pzi.max()], '-', color='#00CC00', lw=2, label=r'$z_{peak}$ $=$ $%.3f^{-%.3f}_{-%.3f}$' %(zpeak[cat['id'] == id], abs(ubound), lbound))
            else:
                if ubound > 0:
                    ax2.plot([zpeak[cat['id'] == id], zpeak[cat['id'] == id]], [0, pzi.max()], '-', color='#00CC00', lw=2, label=r'$z_{peak}$ $=$ $%.3f^{+%.3f}_{+%.3f}$' %(zpeak[cat['id'] == id], ubound, abs(lbound)))
                else:
                    ax2.plot([zpeak[cat['id'] == id], zpeak[cat['id'] == id]], [0, pzi.max()], '-', color='#00CC00', lw=2, label=r'$z_{peak}$ $=$ $%.3f^{-%.3f}_{-%.3f}$' %(zpeak[cat['id'] == id], abs(ubound), abs(lbound)))
            # plot spectroscopic redshift if available
            if zspec[cat['id'] == id] != -1.:
                ax2.plot([zspec[cat['id'] == id], zspec[cat['id'] == id]], [0, pzi.max()], '-', color='#CC0000', lw=2, label=r'$z_{spec}$ $=$ $%.3f$' %(zspec[cat['id'] == id]))
                z = zspec[cat['id'] == id]
            # plot cluster redshift off axis for label
            ax2.plot([-1,-1], [0, pzi.max()], '-', color='#FF8000', lw=2, label=r'$z_{%s}$ $=$ $%.3f$' %(plotname, zclu))
            if len(np.unique(pzi)) != 1:
                ax2.plot(np.array([0]+list(zgrid)), np.array([0]+list(pzi)), '-', color='black', lw=2)
            #ax2.set_yticks(np.arange(0, ceil(pzi.max()), ceil(pzi.max())/5.))
            ax2.set_yticklabels([], fontsize=tickfs)
            ax2.set_xlabel(r'$z$', labelpad=-.5, fontsize=labelfs+10)
            ax2.set_ylabel(r'$p(z)$', fontsize=labelfs+5)
            ax2.legend(loc='upper center', numpoints=1, fontsize=32, frameon=False)
            zmax = np.max([zpeak[cat['id'] == id]*1.5, u68[cat['id'] == id]*1.1, zspec[cat['id'] == id]*1.5, zclu*1.5])
            if zmax > zgrid[-1]:
                zmax = zgrid[-1]
            pmax = pzi[np.where(zgrid == zpeak[cat['id'] == id])]
            if zmax < 0.8:
                ax2.set_xticks(np.arange(0, 10, 0.1))
                ax2.set_xticklabels(np.arange(0, 10, 0.1), fontsize=tickfs, y=-0.01)
            elif zmax < 1.6:
                ax2.set_xticks(np.arange(0, 10, 0.2))
                ax2.set_xticklabels(np.arange(0, 10, 0.2), fontsize=tickfs, y=-0.01)
            elif zmax < 4.:
                ax2.set_xticks(np.arange(0, 10, 0.5))
                ax2.set_xticklabels(np.arange(0, 10, 0.5), fontsize=tickfs, y=-0.01)
            elif zmax < 8.:
                ax2.set_xticks(np.arange(0, 10, 1.))
                ax2.set_xticklabels(np.arange(0, 10, 1.), fontsize=tickfs, y=-0.01)
            else:
                ax2.set_xticks(np.arange(0, zmax, 2.))
                ax2.set_xticklabels(np.arange(0, zmax, 2.), fontsize=tickfs, y=-0.01)
            ax2.set_xlim(0., zmax); ax2.set_ylim(0, pzi.max()*1.5)
            ax2.xaxis.set_tick_params(width=2, length=10)

            # PNGs
            x1 = 0.495
            x2 = 0.66
            x3 = 0.825
            y1 = 0.519
            y2 = 0.037
            xsize = 0.152
            ysize = 0.432

            if id < 20000:
                im = plt.imread('%sFFweb/%s/object_cutouts/%d/%d_acs_rgb.png' %(mainDir, plotname, (id/100)*100, id))
                # title naming is acting strange but adding them on the next plot seems to work for now
                plt.title('Redshift PDF', fontsize=labelfs+3, y=1.02)
                ax3 = fig.add_axes([x1, y1, xsize, ysize])
                ax3.imshow(im, origin='upper')
                ax3.axis('off')

                im2 = plt.imread('%sFFweb/%s/object_cutouts/%d/%d_ijh_rgb.png' %(mainDir, plotname, (id/100)*100, id))
                plt.title('RGB 1', fontsize=labelfs+3, y=1.02)
                ax4 = fig.add_axes([x2, y1, xsize, ysize])
                ax4.imshow(im2, origin='upper')
                ax4.axis('off')

                im3 = plt.imread('%sFFweb/%s/object_cutouts/%d/%d_ijk_rgb.png' %(mainDir, plotname, (id/100)*100, id))
                plt.title('RGB 2', fontsize=labelfs+3, y=1.02)
                ax5 = fig.add_axes([x3, y1, xsize, ysize])
                ax5.imshow(im3, origin='upper')
                ax5.axis('off')
                
                im4 = plt.imread('%sFFweb/%s/object_cutouts/%d/%d_det_rgb.png' %(mainDir, plotname, (id/100)*100, id))
                plt.title('RGB 3', fontsize=labelfs+3, y=1.02)
                ax6 = fig.add_axes([x1, y2, xsize, ysize])
                ax6.imshow(im4, origin='upper')
                ax6.axis('off')

                im5 = plt.imread('%sFFweb/%s/object_cutouts/%d/%d_seg.png' %(mainDir, plotname, (id/100)*100, id))
                plt.title('Detection Image', fontsize=labelfs+3, y=1.02)
                ax7 = fig.add_axes([x2, y2, xsize, ysize])
                ax7.imshow(im5, origin='upper')
                ax7.axis('off')

                magcb = plt.imread('%sFFweb/magnificationcolorbar.png' %(mainDir))
                plt.title('Segmentation Map', fontsize=labelfs+3, y=1.02)
                ax9 = fig.add_axes([0.9572, 0.022, 0.05, 0.4615])
                ax9.imshow(magcb, origin='upper')
                ax9.axis('off')

                im6 = plt.imread('%sFFweb/%s/object_cutouts/%d/%d_mag.png' %(mainDir, plotname, (id/100)*100, id))
                plt.title('', fontsize=labelfs+3, y=1.02)
                ax8 = fig.add_axes([x3, y2, xsize, ysize])
                ax8.imshow(im6, origin='upper')
                ax8.axis('off')

                plt.title('Magnification Map', fontsize=labelfs+3, y=1.02)
            else:
                im = plt.imread('%sFFweb/%s/object_cutouts/%d/%d_acs_rgb.png' %(mainDir, plotname, (id/100)*100, id))
                # title naming is acting strange but adding them on the next plot seems to work for now
                plt.title('Redshift PDF', fontsize=labelfs+3, y=1.02)
                ax3 = fig.add_axes([x1, y1, xsize, ysize])
                ax3.imshow(im, origin='upper')
                ax3.axis('off')

                im2 = plt.imread('%sFFweb/%s/object_cutouts/%d/%d_ijh_rgb.png' %(mainDir, plotname, (id/100)*100, id))
                plt.title('RGB 1 w/ BCGs', fontsize=labelfs+3, y=1.02)
                ax4 = fig.add_axes([x2, y1, xsize, ysize])
                ax4.imshow(im2, origin='upper')
                ax4.axis('off')

                im3 = plt.imread('%sFFweb/%s/object_cutouts/%d/%d_ijk_rgb.png' %(mainDir, plotname, (id/100)*100, id))
                plt.title('RGB 2 w/ BCGs', fontsize=labelfs+3, y=1.02)
                ax5 = fig.add_axes([x3, y1, xsize, ysize])
                ax5.imshow(im3, origin='upper')
                ax5.axis('off')
            
                im4 = plt.imread('%sFFweb/%s/object_cutouts/%d/%d_acs_bcgs_out_rgb.png' %(mainDir, plotname, (id/100)*100, id))
                plt.title('RGB 3 w/ BCGs', fontsize=labelfs+3, y=1.02)
                ax6 = fig.add_axes([x1, y2, xsize, ysize])
                ax6.imshow(im4, origin='upper')
                ax6.axis('off')

                im5 = plt.imread('%sFFweb/%s/object_cutouts/%d/%d_ijh_bcgs_out_rgb.png' %(mainDir, plotname, (id/100)*100, id))
                plt.title('RGB 1', fontsize=labelfs+3, y=1.02)
                ax7 = fig.add_axes([x2, y2, xsize, ysize])
                ax7.imshow(im5, origin='upper')
                ax7.axis('off')

                im6 = plt.imread('%sFFweb/%s/object_cutouts/%d/%d_ijk_bcgs_out_rgb.png' %(mainDir, plotname, (id/100)*100, id))
                plt.title('RGB 2', fontsize=labelfs+3, y=1.02)
                ax8 = fig.add_axes([x3, y2, xsize, ysize])
                ax8.imshow(im6, origin='upper')
                ax8.axis('off')
                
                plt.title('RGB 3', fontsize=labelfs+3, y=1.02)


            # SED Title Legend
            im7 = plt.imread('%sFFweb/sedtitlelegend.png' %(mainDir))
            ax9 = fig.add_axes([0.0182,0.948,0.29,0.05])
            ax9.imshow(im7, origin='upper')
            ax9.axis('off')
            savefig('%sWebsite/HFFexplorer/%s/object_figs/%d/%d.%s' %(mainDir, plotname, (id/100)*100, id, saveExt))
            close(fig)
