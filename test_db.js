import DB from "./express_pms_be/core/config/knex.js";

async function run() {
  try {
    const oPayload = {
      kode_tipe_kamar: 'TK-0001',
      kode_rate_plan: 'RP-001'
    };
    
    // First, verify records exist
    const tipeKamar = await DB("mst_tipe_kamar").select("*").limit(1);
    const ratePlan = await DB("mst_paket_harga").select("*").limit(1);
    
    console.log("Found Tipe Kamar:", tipeKamar[0]?.kode_tipe_kamar);
    console.log("Found Rate Plan:", ratePlan[0]?.kode_paket_harga);
    
    if (tipeKamar.length && ratePlan.length) {
        oPayload.kode_tipe_kamar = tipeKamar[0].kode_tipe_kamar;
        oPayload.kode_rate_plan = ratePlan[0].kode_paket_harga;
    }

    const masterData = await DB("mst_tipe_kamar as tk")
      .join("mst_paket_harga as rp", function() {
        this.on("rp.kode_paket_harga", "=", DB.raw("?", [oPayload.kode_rate_plan]))
            .andOnNull("rp.deleted_at");
      })
      .where("tk.kode_tipe_kamar", oPayload.kode_tipe_kamar)
      .whereNull("tk.deleted_at")
      .select("tk.harga_default", "rp.tipe_markup", "rp.nilai_markup")
      .first();
    console.log("MasterData result:", masterData);
    
  } catch(e) {
    console.error(e);
  }
  process.exit();
}
run();
