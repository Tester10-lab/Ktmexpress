import GlobalPricingSettings from '../models/GlobalPricingSettings.js';
import OutsideValleyFee from '../models/OutsideValleyFee.js';
import { logger } from '../config/logger.js';

export const KDM_EXPRESS_RATES = [
  { city: "ARGAKHACHI (SANDHIKHARKA)", fee: 300 },
  { city: "ARUN KHOLA (EAST NAWALPARASI)", fee: 225 },
  { city: "ATTARIYA (KAILALI)", fee: 250 },
  { city: "BAGLUNG", fee: 225 },
  { city: "BAJURA (KOLTI)", fee: 295 },
  { city: "BANEPA (KAVRE)", fee: 200 },
  { city: "BANIYANI (JHAPA)", fee: 250 },
  { city: "BANSAGADHI (BARDIYA)", fee: 250 },
  { city: "BARDAGHAT (NAWALPARASI)", fee: 225 },
  { city: "BARDIBAS", fee: 225 },
  { city: "BATTAR BAZAR (NUWAKOT)", fee: 225 },
  { city: "BAUNIYA (KAILALI)", fee: 225 },
  { city: "BELAURI (KANCHANPUR)", fee: 300 },
  { city: "BELBARI (MORANG)", fee: 225 },
  { city: "BELTAR (UDAYAPUR)", fee: 300 },
  { city: "BENI", fee: 225 },
  { city: "BHADRAPUR (JHAPA)", fee: 225 },
  { city: "BHAIRAHAWA", fee: 200 },
  { city: "BHAJANI (KAILALI)", fee: 250 },
  { city: "BHALUBANG (DANG)", fee: 250 },
  { city: "BHOJPUR", fee: 275 },
  { city: "BHURIGOAN (BARDIYA)", fee: 250 },
  { city: "BIDUR (NUWAKOT)", fee: 225 },
  { city: "BIRATCHOWK (MORANG)", fee: 225 },
  { city: "BIRATNAGAR", fee: 200 },
  { city: "BIRGUNJ", fee: 200 },
  { city: "BIRTAMOD (JHAPA)", fee: 225 },
  { city: "BUDHABARE (JHAPA)", fee: 250 },
  { city: "BURTIBANG (BAGLUNG)", fee: 300 },
  { city: "BUTWAL", fee: 200 },
  { city: "CHAINPUR (BAJHANG)", fee: 295 },
  { city: "CHAINPUR (SANKHUWASOWA)", fee: 275 },
  { city: "CHANDRANIGAHAPUR (RAUTAHAT)", fee: 250 },
  { city: "CHANDRAUTA (KAPILVASTU)", fee: 225 },
  { city: "CHARAALI (JHAPA)", fee: 225 },
  { city: "CHARIKOT (DOLAKHA)", fee: 225 },
  { city: "CHINCHU (BHERI)", fee: 250 },
  { city: "CHISAPANI (KAILALI)", fee: 250 },
  { city: "CHORMARA (EAST NAWALPARASI)", fee: 225 },
  { city: "DADELDHURA (AMARGADI)", fee: 275 },
  { city: "DAILEKH BAZAR", fee: 250 },
  { city: "DALDALE (EAST NAWALPARASI)", fee: 225 },
  { city: "DAMAK (JHAPA)", fee: 225 },
  { city: "DAMAULI", fee: 225 },
  { city: "DARCHULA (KHALANGA)", fee: 298 },
  { city: "DHADING (BESI)", fee: 225 },
  { city: "DHALKEBAR (DHANUSA)", fee: 225 },
  { city: "DHANGADHI (SUDUR PASCHIM)", fee: 225 },
  { city: "DHANKUTA", fee: 275 },
  { city: "DHARAN", fee: 225 },
  { city: "DHULABARI (JHAPA)", fee: 225 },
  { city: "DHULIKHEL", fee: 200 },
  { city: "DIKTEL BAZAAR (KHOTANG)", fee: 298 },
  { city: "DIPAYAL BAZAR (DOTI)", fee: 275 },
  { city: "DODHARA CHADANI (KANCHANPUR)", fee: 300 },
  { city: "DUDHAULI (SINDHULI)", fee: 250 },
  { city: "DUHABI (SUNSARI)", fee: 225 },
  { city: "DULLU (DAILEKH)", fee: 300 },
  { city: "DUMKIBAS (EAST NAWALPARASI)", fee: 225 },
  { city: "DUMRE", fee: 225 },
  { city: "FIKKAL", fee: 250 },
  { city: "GAIDAKOT (NAWALPARASI EAST)", fee: 225 },
  { city: "GAIGHAT (UDAYAPUR)", fee: 225 },
  { city: "GALKOT (BAGLUNG)", fee: 250 },
  { city: "GAUR (RAUTAHAT)", fee: 250 },
  { city: "GAURADAHA (JHAPA)", fee: 250 },
  { city: "GAURIGANJ (JHAPA)", fee: 250 },
  { city: "GAUSHALA (MAHOTTARI)", fee: 250 },
  { city: "GHORAHI (DANG)", fee: 225 },
  { city: "GOKULESWOR (DARCHULA)", fee: 298 },
  { city: "GORKHA (PALUNGTAR)", fee: 300 },
  { city: "GORKHA BAZAAR", fee: 225 },
  { city: "GOTHLAPANI (BAITADI)", fee: 298 },
  { city: "GULARITYA (BARDIYA)", fee: 250 },
  { city: "GULMI (TAMGHAS)", fee: 225 },
  { city: "HALDIBARI (JHAPA)", fee: 250 },
  { city: "HARIWAN (SARLAHI)", fee: 225 },
  { city: "HEMJA (POKHARA)", fee: 225 },
  { city: "HETAUDA", fee: 225 },
  { city: "HILE BAZAR (DHANKUTA)", fee: 295 },
  { city: "ILAM BAZAAR", fee: 250 },
  { city: "INARUWA (SUNSARI)", fee: 225 },
  { city: "ITAHARI", fee: 200 },
  { city: "JAJARKOT", fee: 275 },
  { city: "JALESHWOR (MAHOTTARI)", fee: 225 },
  { city: "JANAKPUR", fee: 225 },
  { city: "JEETPUR (BARA)", fee: 225 },
  { city: "JEETPUR NO.4 (KAPILVASTU)", fee: 225 },
  { city: "JHALARI (KANCHANPUR)", fee: 300 },
  { city: "JIRIKHIMTI (TERAHTHUM)", fee: 298 },
  { city: "JOGIKUTI (RUPANDEHI)", fee: 225 },
  { city: "JOMSOM", fee: 295 },
  { city: "JOSHIPUR (KAILALI)", fee: 250 },
  { city: "JUMLA (KHALANGA)", fee: 295 }
];

export async function seedExcelPricing(force = false) {
  try {
    const existingCount = await OutsideValleyFee.countDocuments();
    const globalSetting = await GlobalPricingSettings.findById('global');

    // Seed if empty/low or forced or if ktmBaseRate is still default 150
    if (force || existingCount < 10 || !globalSetting || globalSetting.ktmBaseRate === 150) {
      if (logger) logger.info('Seeding/updating KDM Express pricing rates from master catalog...');
      else console.log('Seeding/updating KDM Express pricing rates from master catalog...');

      // Update Global Settings (KTM Base Rate = 100)
      await GlobalPricingSettings.findByIdAndUpdate(
        'global',
        { ktmBaseRate: 100, weightSurchargePerKg: 50 },
        { new: true, upsert: true }
      );

      // Bulk upsert all 95 Outside Valley Rates
      const bulkOps = KDM_EXPRESS_RATES.map(item => ({
        updateOne: {
          filter: { city: item.city },
          update: { $set: { fee: item.fee, isActive: true } },
          upsert: true
        }
      }));

      await OutsideValleyFee.bulkWrite(bulkOps);

      if (logger) logger.info(`Successfully seeded ${KDM_EXPRESS_RATES.length} Outside Valley cities and set KTM base rate to 100.`);
      else console.log(`Successfully seeded ${KDM_EXPRESS_RATES.length} Outside Valley cities and set KTM base rate to 100.`);

      return { seeded: true, count: KDM_EXPRESS_RATES.length };
    }
    return { seeded: false, count: existingCount };
  } catch (err) {
    if (logger) logger.error(`Failed to seed excel pricing: ${err.message}`);
    else console.error(`Failed to seed excel pricing: ${err.message}`);
    throw err;
  }
}
