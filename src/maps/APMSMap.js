/**
 * ============================================================
 * MAPA DO APMS
 * ============================================================
 *
 * Este arquivo representa toda a estrutura navegável do APMS.
 * Nenhum workflow deve conhecer URLs ou menus diretamente.
 *
 */

const APMSMap = {

    menus: {

        reports: {},

        campaign: {},

        materialManagement: {},

        invoiceOrder: {},

        warranty: {}

    },

    pages: {

        statement: {},

        material: {},

        invoice: {},

        ng: {}

    }

};

export default APMSMap;