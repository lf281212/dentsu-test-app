const settings = {
    regionCode: '',
    regionName: '',
    applySettings(region) {
        this.regionCode = region;
        switch (region) {
            case 'msk': this.regionName = 'Москва'; break;
            case 'spb': this.regionName = 'Санкт-Петербург'; break;
            default:
                this.regionCode = 'msk';
                this.regionName = 'Москва';
                break;
        }
    }
}

module.exports = settings;