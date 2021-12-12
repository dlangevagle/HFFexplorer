#Created by Miranda Apfel
#Texas A&M University
#You may freely use and alter this code


def ffxy(field): #creates json file that has x-values followed by y-values
    import astropy.table
    table = astropy.table.Table()
    import os
    cat = table.read('/Users/hff/HAWKI/Release/%s/catalogs/hffds_%s_v3.9.cat' %(field.replace('clu',''), field), format='ascii') #loads catalog
    if 'abell' in field:
        fName = field.replace('abell','A').replace('clu','-clu').replace('par','-par')
    if 'macs' in field:
        fName = field.replace('macs','M').replace('clu','-clu').replace('par','-par')
    f = open('/Users/hff/HAWKI/Website/HFFexplorer/%s/JSON/XY/xy.js' %(fName), 'w') #creates jsonfile
    f.write('[')
    for i in range(len(cat)):
        f.write(str(cat['x'][i])+',\n')
    for j in range(len(cat)-1):
        f.write(str(cat['y'][j])+',\n')
    f.write(str(cat['y'][len(cat)-1])+']')

def cosmosxy(dummy): #creates json file that has x-values followed by y-values
    import numpy
    import os
    cat=numpy.loadtxt("/Users/miranda/Documents/Zfourge/Object_Pages/Cosmos/catalogs/cosmos.v1.3.1.cat") #loads catalog
    f=open('cosmosxy.js', 'w') #creates jsonfile
    f.write('['+str(cat[0,1])+',\n')
    for i in range(1,20786):
        f.write(str(cat[i,1])+',\n')
    for j in range(0,20785):
        f.write(str(cat[j,2])+',\n')
    f.write(str(cat[20785,2])+']')

def udsxy(dummy):
    import numpy
    import os
    cat=numpy.loadtxt("/Users/miranda/Documents/Zfourge/Object_Pages/UDS/catalogs/uds.v1.5.3.cat")
    f=open('udsxy.js', 'w')
    f.write('['+str(cat[0,1])+',\n')
    for i in range(1,22093):
        f.write(str(cat[i,1])+',\n')
    for j in range(0,22092):
        f.write(str(cat[j,2])+',\n')
    f.write(str(cat[22092,2])+']')

def cdfsxy(dummy):
    import numpy
    import os
    cat=numpy.loadtxt("/Users/miranda/Documents/Zfourge/Object_Pages/CDFS/catalogs/cdfs.v1.6.3.cat")
    f=open('cdfsxy.js', 'w')
    f.write('['+str(cat[0,1])+',\n')
    for i in range(1,30911):
        f.write(str(cat[i,1])+',\n')
    for j in range(0,30910):
        f.write(str(cat[j,2])+',\n')
    f.write(str(cat[30910,2])+']')


def cosmosarray(): #testing something else, didn't use
    import numpy
    import math
    import os.path
    cat1=numpy.loadtxt("/Users/miranda/Documents/Zfourge/Object_Pages/Cosmos/catalogs/cosmos.v1.3.1.cat")
    cat2=numpy.loadtxt("/Users/miranda/Documents/Zfourge/Object_Pages/Cosmos/catalogs/cosmos.v1.3.1.zout")
    cat3=numpy.loadtxt("/Users/miranda/Documents/Zfourge/Object_Pages/Cosmos/catalogs/cosmos.v1.3.1.fout")
    cat4=numpy.loadtxt("/Users/miranda/Documents/Zfourge/Object_Pages/Cosmos/catalogs/cosmos.v1.3.1.sfr.v0.3.cat")
    cat5=numpy.loadtxt("/Users/miranda/Documents/Zfourge/Object_Pages/Cosmos/catalogs/cosmos.v1.3.1.153.rf")
    cat6=numpy.loadtxt("/Users/miranda/Documents/Zfourge/Object_Pages/Cosmos/catalogs/cosmos.v1.3.1.155.rf")
    cat7=numpy.loadtxt("/Users/miranda/Documents/Zfourge/Object_Pages/Cosmos/catalogs/cosmos.v1.3.1.161.rf")
    cat8=numpy.loadtxt("/Users/miranda/Documents/Zfourge/Object_Pages/Cosmos/catalogs/cosmos.v1.3.1.agn.v0.3.cat")
    cat9=numpy.loadtxt("/Users/miranda/Documents/Zfourge/Object_Pages/Cosmos/catalogs/cosmos.v1.3.1.zspec.v0.3.cat")
    xs=cat1[:,1]
    ys=cat1[:,2]
    ras=cat1[:,3]
    decs=cat1[:,4]
    f_Ks=cat1[:,21]
    f_Is=cat1[:,30]
    z_peaks=cat2[:,17]
    z_specs=cat9[:,1]
    stars=cat1[:,142]
    agns=cat8[:,1]
    masses=cat3[:,6]
    sfrs=cat4[:,6]
    Us=cat5[:,5]
    Vs=cat6[:,5]
    Js=cat7[:,5]
    UVs=numpy.empty(20786)
    VJs=numpy.empty(20786)
    magks=numpy.empty(20786)
    magis=numpy.empty(20786)
    for i in range(0,20786):
        if (Us[i]/Vs[i])>0:
            UVs[i]=-2.512*math.log10(Us[i]/Vs[i])
        else:
            UVs[i]=-99
    for j in range(0,20786):
        if (Vs[j]/Js[j])>0:
            VJs[j]=-2.512*math.log10(Vs[j]/Js[j])
        else:
            VJs[j]=-99
    for k in range(0,20786):
        if (f_Ks[k]>0):
            magks[k]=-2.512*math.log10(f_Ks[k])+25
        else:
            magks[k]=-99
    for l in range(0,20786):
        if (f_Is[l]>0):
            magis[l]=-2.512*math.log10(f_Is[l])+25
        else:
            magis[l]=-99
    for m in range(0,20786):
        if (masses[m]==-1 or math.isnan(masses[m])):
            masses[m]=-99
    for n in range(0,20786):
        if (sfrs[n]=='-inf' or math.isnan(sfrs[n])):
            sfrs[n]=-99
    for q in range(0,20786):
        if z_specs[q]>0:
            z_specs[q]=z_specs[q]
        else:
            z_specs[q]=-99

    f=open('cosmosarray.js', 'w')
    f.write('[\n')
    for p in range(0,20785):
            f.write('{\n"object": "'+str(p+1)+'",\n"x": "'+str(xs[p])+'",\n"y": "'+str(ys[p])+'",\n"ra": "'+str(ras[p])+'",\n"dec": "'+str(decs[p])+'",\n"magk": "'+str(magks[p])+'",\n"magi": "'+str(magis[p])+'",\n"zphot": "'+str(z_peaks[p])+'",\n"zspec": "'+str(z_specs[p])+'",\n"star": "'+str(int(stars[p]))+'",\n"agn": "'+str(int(agns[p]))+'",\n"mass": "'+str(masses[p])+'",\n"sfr": "'+str(sfrs[p])+'",\n"UV": "'+str(UVs[p])+'",\n"VJ": "'+str(VJs[p])+'"\n},\n')
    f.write('{\n"object": "20786",\n"x": "'+str(xs[20785])+'",\n"y": "'+str(ys[20785])+'",\n"ra": "'+str(ras[20785])+'",\n"dec": "'+str(decs[20785])+'",\n"magk": "'+str(magks[20785])+'",\n"magi": "'+str(magis[20785])+'",\n"zphot": "'+str(z_peaks[20785])+'",\n"zspec": "'+str(z_specs[20785])+'",\n"star": "'+str(int(stars[20785]))+'",\n"agn": "'+str(int(agns[20785]))+'",\n"mass": "'+str(masses[20785])+'",\n"sfr": "'+str(sfrs[20785])+'",\n"UV": "'+str(UVs[20785])+'",\n"VJ": "'+str(VJs[20785])+'"\n}\n]')
