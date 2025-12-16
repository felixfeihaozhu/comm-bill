/**
 * 对比模式 - 价格对比分析
 * 功能：西区/德区价格对比、会员折扣、利润计算
 */

(function() {
  'use strict';

  const CompareMode = {
    name: 'compare',
    data: null,

    // 初始化
    async init() {
      // 配置数据已迁移至 Firebase，无需加载本地 JSON
      console.log('✅ Compare mode initialized');
    },

    // 激活模式
    activate() {
      // 显示对比输入区
      document.querySelectorAll('.compare-inputs').forEach(el => el.style.display = 'block');
      // 显示对比预览区
      document.querySelector('.compare-preview')?.style.removeProperty('display');
      
      const formPane = document.querySelector('.pane-form');
      if (formPane) formPane.classList.add('compare-mode');
      
      const previewPane = document.querySelector('.pane-preview');
      if (previewPane) previewPane.classList.add('compare-mode');
    },

    // 停用模式
    deactivate() {
      // 隐藏对比输入区
      document.querySelectorAll('.compare-inputs').forEach(el => el.style.display = 'none');
      // 隐藏对比预览区
      document.querySelector('.compare-preview')?.style.setProperty('display', 'none');
      
      const formPane = document.querySelector('.pane-form');
      if (formPane) formPane.classList.remove('compare-mode');
      
      const previewPane = document.querySelector('.pane-preview');
      if (previewPane) previewPane.classList.remove('compare-mode');
    },

    // 计算成本价
    calculate() {
      const westData = this.getRegionData('West');
      const germanData = this.getRegionData('German');
      
      return {
        west: this.calculateRegionCost(westData),
        german: this.calculateRegionCost(germanData)
      };
    },

    // 获取区域输入数据
    getRegionData(region) {
      return {
        gross: Number(document.getElementById(`compare${region}`)?.value) || 0,
        tax: Number(document.getElementById(`compare${region}Tax`)?.value) || 0,
        hsc: Number(document.getElementById(`compare${region}Hsc`)?.value) || 0,
        club: (Number(document.getElementById(`compare${region}Club`)?.value) || 0) / 100,
        selection: (Number(document.getElementById(`compare${region}Selection`)?.value) || 0) / 100,
        discount: (Number(document.getElementById(`compare${region}Discount`)?.value) || 0) / 100,
        rate: (Number(document.getElementById(`compare${region}Rate`)?.value) || 0) / 100
      };
    },

    // 计算单个区域成本
    calculateRegionCost(data) {
      const base = Math.max(0, data.gross - data.tax - data.hsc);
      const afterClub = base * (1 - data.club);
      const afterSelection = afterClub * (1 - data.selection);
      const discBase = afterSelection * (1 - data.discount);
      const comm = discBase * data.rate;
      const net = discBase - comm;
      const final = net + data.tax + data.hsc;

      return {
        gross: data.gross,
        tax: data.tax,
        hsc: data.hsc,
        club: data.club * 100,
        selection: data.selection * 100,
        rate: data.rate * 100,
        discount: data.discount * 100,
        base,
        afterClub,
        afterSelection,
        discBase,
        comm,
        net,
        final
      };
    },

    // 更新预览
    updatePreview(result) {
      // 支持两种调用方式
      let westData, germanData;
      if (result.west && result.german) {
        westData = result.west;
        germanData = result.german;
      } else {
        // 兼容旧的两参数调用
        westData = arguments[0];
        germanData = arguments[1];
      }
      
      this.updateRegionPreview('west', westData);
      this.updateRegionPreview('german', germanData);
      this.updateComparison(westData, germanData);
      this.updateProfitComparison(westData, germanData);
    },

    // 更新区域预览
    updateRegionPreview(region, data) {
      const fm = window.formatMoney;
      
      document.getElementById(`preview-${region}-gross`).textContent = fm(data.gross) + ' EUR';
      document.getElementById(`preview-${region}-tax`).textContent = fm(data.tax) + ' EUR';
      document.getElementById(`preview-${region}-hsc`).textContent = fm(data.hsc) + ' EUR';
      document.getElementById(`preview-${region}-base`).textContent = fm(data.base) + ' EUR';
      document.getElementById(`preview-${region}-tax2`).textContent = fm(data.tax) + ' EUR';
      document.getElementById(`preview-${region}-hsc2`).textContent = fm(data.hsc) + ' EUR';
      document.getElementById(`preview-${region}-comm-rate`).textContent = data.rate.toFixed(0);
      document.getElementById(`preview-${region}-comm`).textContent = fm(data.comm) + ' EUR';
      document.getElementById(`preview-${region}-net`).textContent = fm(data.net) + ' EUR';
      document.getElementById(`preview-${region}-final`).textContent = fm(data.final) + ' EUR';

      // Club折扣
      this.toggleRow(`preview-${region}-club-row`, data.club > 0, () => {
        document.getElementById(`preview-${region}-club-rate`).textContent = data.club.toFixed(0);
        document.getElementById(`preview-${region}-club-amt`).textContent = fm(data.base - data.afterClub) + ' EUR';
        document.getElementById(`preview-${region}-afterclub`).textContent = fm(data.afterClub) + ' EUR';
      });
      this.toggleRow(`preview-${region}-afterclub-row`, data.club > 0);

      // Selection折扣
      this.toggleRow(`preview-${region}-selection-row`, data.selection > 0, () => {
        document.getElementById(`preview-${region}-selection-rate`).textContent = data.selection.toFixed(0);
        document.getElementById(`preview-${region}-selection-amt`).textContent = fm(data.afterClub - data.afterSelection) + ' EUR';
        document.getElementById(`preview-${region}-afterselection`).textContent = fm(data.afterSelection) + ' EUR';
      });
      this.toggleRow(`preview-${region}-afterselection-row`, data.selection > 0);

      // 优惠折扣
      this.toggleRow(`preview-${region}-discount-row`, data.discount > 0, () => {
        document.getElementById(`preview-${region}-discount-rate`).textContent = data.discount.toFixed(0);
        document.getElementById(`preview-${region}-discount-amt`).textContent = fm(data.afterSelection - data.discBase) + ' EUR';
        document.getElementById(`preview-${region}-discounted`).textContent = fm(data.discBase) + ' EUR';
      });
      this.toggleRow(`preview-${region}-discounted-row`, data.discount > 0);
    },

    // 切换行显示
    toggleRow(id, show, callback) {
      const row = document.getElementById(id);
      if (row) {
        row.style.display = show ? 'flex' : 'none';
        if (show && callback) callback();
      }
    },

    // 更新对比结果
    updateComparison(westData, germanData) {
      const fm = window.formatMoney;
      const diff = Math.abs(westData.final - germanData.final);
      
      document.getElementById('preview-diff').textContent = fm(diff) + ' EUR';
      
      let bestRegion = '-';
      if (westData.final > 0 && germanData.final > 0) {
        bestRegion = westData.final < germanData.final ? '西区 West Region' : '德区 German Region';
      } else if (westData.final > 0) {
        bestRegion = '西区 West Region';
      } else if (germanData.final > 0) {
        bestRegion = '德区 German Region';
      }
      document.getElementById('preview-best').textContent = bestRegion;
    },

    // 更新利润对比
    updateProfitComparison(westData, germanData) {
      const fm = window.formatMoney;
      const actualPrice = Number(document.getElementById('compareActualPrice')?.value) || 0;
      
      // 获取同行返佣（可以同时有比例和金额，相加）
      const peerCommRate = Number(document.getElementById('peerCommissionRate')?.value) || 0;
      const peerCommAmount = Number(document.getElementById('peerCommissionAmount')?.value) || 0;
      
      let westProfit, germanProfit;
      const hasPeerComm = peerCommRate > 0 || peerCommAmount > 0;
      
      // 如果有同行返佣，使用新的计算方式
      if (hasPeerComm) {
        // 步骤1: 实际售价 - 西区税 - 西区服务费 = 同行船票价（德区也用西区的税费）
        const peerBasePrice = actualPrice - westData.tax - westData.hsc;
        
        // 计算返佣金额（比例 + 固定金额）
        let totalPeerCommissionWest = 0;
        let totalPeerCommissionGerman = 0;
        
        // 按比例计算的返佣
        if (peerCommRate > 0) {
          totalPeerCommissionWest += peerBasePrice * (peerCommRate / 100);
          totalPeerCommissionGerman += peerBasePrice * (peerCommRate / 100);
        }
        
        // 固定金额的返佣
        if (peerCommAmount > 0) {
          totalPeerCommissionWest += peerCommAmount;
          totalPeerCommissionGerman += peerCommAmount;
        }
        
        // 步骤2: 同行船票价 - 返佣 = 同行净船票价
        const peerNetTicketWest = peerBasePrice - totalPeerCommissionWest;
        const peerNetTicketGerman = peerBasePrice - totalPeerCommissionGerman;
        
        // 步骤3: 同行净船票价 + 西区税 + 西区服务费 = 同行支付价（德区也加西区的税费）
        const peerPayWest = peerNetTicketWest + westData.tax + westData.hsc;
        const peerPayGerman = peerNetTicketGerman + westData.tax + westData.hsc;
        
        // 步骤4: 利润 = 同行支付价 - 成本价
        westProfit = peerPayWest - westData.final;
        germanProfit = peerPayGerman - germanData.final;
        
        // 显示详细计算步骤（德区也显示西区的税费）
        this.showProfitDetails(true, {
          west: {
            actual: actualPrice,
            tax: westData.tax,
            hsc: westData.hsc,
            base: peerBasePrice,
            commission: totalPeerCommissionWest,
            netTicket: peerNetTicketWest,
            peerPay: peerPayWest,
            cost: westData.final,
            profit: westProfit
          },
          german: {
            actual: actualPrice,
            tax: westData.tax,  // 德区也用西区税费
            hsc: westData.hsc,  // 德区也用西区服务费
            base: peerBasePrice,
            commission: totalPeerCommissionGerman,
            netTicket: peerNetTicketGerman,
            peerPay: peerPayGerman,
            cost: germanData.final,
            profit: germanProfit
          }
        });
      } else {
        // 原有计算方式：实际售价 - 成本价
        westProfit = actualPrice - westData.final;
        germanProfit = actualPrice - germanData.final;
        
        // 隐藏详细计算步骤
        this.showProfitDetails(false, {
          west: {
            actual: actualPrice,
            cost: westData.final,
            profit: westProfit
          },
          german: {
            actual: actualPrice,
            cost: germanData.final,
            profit: germanProfit
          }
        });
      }

      let bestProfitRegion = '-';
      if (actualPrice > 0) {
        if (westProfit > germanProfit) {
          bestProfitRegion = '西区 West Region (高利润 ' + fm(westProfit - germanProfit) + ' EUR)';
        } else if (germanProfit > westProfit) {
          bestProfitRegion = '德区 German Region (高利润 ' + fm(germanProfit - westProfit) + ' EUR)';
        } else {
          bestProfitRegion = '利润相同 Same Profit';
        }
      }
      document.getElementById('profit-best-region').textContent = bestProfitRegion;
    },

    // 显示或隐藏利润详情
    showProfitDetails(showDetails, data) {
      const fm = window.formatMoney;
      
      if (showDetails) {
        // 显示详细计算步骤
        // 西区
        document.getElementById('profit-west-actual').textContent = fm(data.west.actual) + ' EUR';
        document.getElementById('profit-west-tax').textContent = fm(data.west.tax) + ' EUR';
        document.getElementById('profit-west-hsc').textContent = fm(data.west.hsc) + ' EUR';
        document.getElementById('profit-west-base').textContent = fm(data.west.base) + ' EUR';
        document.getElementById('profit-west-peercomm').textContent = fm(data.west.commission) + ' EUR';
        document.getElementById('profit-west-netticket').textContent = fm(data.west.netTicket) + ' EUR';
        document.getElementById('profit-west-addtax').textContent = fm(data.west.tax) + ' EUR';
        document.getElementById('profit-west-addhsc').textContent = fm(data.west.hsc) + ' EUR';
        document.getElementById('profit-west-peerpay').textContent = fm(data.west.peerPay) + ' EUR';
        document.getElementById('profit-west-cost').textContent = fm(data.west.cost) + ' EUR';
        document.getElementById('profit-west-total').textContent = fm(data.west.profit) + ' EUR';
        
        // 显示详细行
        document.getElementById('profit-west-tax-row').style.display = 'flex';
        document.getElementById('profit-west-hsc-row').style.display = 'flex';
        document.getElementById('profit-west-base-row').style.display = 'flex';
        document.getElementById('profit-west-peercomm-row').style.display = 'flex';
        document.getElementById('profit-west-netticket-row').style.display = 'flex';
        document.getElementById('profit-west-addtax-row').style.display = 'flex';
        document.getElementById('profit-west-addhsc-row').style.display = 'flex';
        document.getElementById('profit-west-peerpay-row').style.display = 'flex';
        
        // 德区
        document.getElementById('profit-german-actual').textContent = fm(data.german.actual) + ' EUR';
        document.getElementById('profit-german-tax').textContent = fm(data.german.tax) + ' EUR';
        document.getElementById('profit-german-hsc').textContent = fm(data.german.hsc) + ' EUR';
        document.getElementById('profit-german-base').textContent = fm(data.german.base) + ' EUR';
        document.getElementById('profit-german-peercomm').textContent = fm(data.german.commission) + ' EUR';
        document.getElementById('profit-german-netticket').textContent = fm(data.german.netTicket) + ' EUR';
        document.getElementById('profit-german-addtax').textContent = fm(data.german.tax) + ' EUR';
        document.getElementById('profit-german-addhsc').textContent = fm(data.german.hsc) + ' EUR';
        document.getElementById('profit-german-peerpay').textContent = fm(data.german.peerPay) + ' EUR';
        document.getElementById('profit-german-cost').textContent = fm(data.german.cost) + ' EUR';
        document.getElementById('profit-german-total').textContent = fm(data.german.profit) + ' EUR';
        
        // 显示详细行
        document.getElementById('profit-german-tax-row').style.display = 'flex';
        document.getElementById('profit-german-hsc-row').style.display = 'flex';
        document.getElementById('profit-german-base-row').style.display = 'flex';
        document.getElementById('profit-german-peercomm-row').style.display = 'flex';
        document.getElementById('profit-german-netticket-row').style.display = 'flex';
        document.getElementById('profit-german-addtax-row').style.display = 'flex';
        document.getElementById('profit-german-addhsc-row').style.display = 'flex';
        document.getElementById('profit-german-peerpay-row').style.display = 'flex';
      } else {
        // 简单模式，隐藏详细步骤
        // 西区
        document.getElementById('profit-west-actual').textContent = fm(data.west.actual) + ' EUR';
        document.getElementById('profit-west-cost').textContent = fm(data.west.cost) + ' EUR';
        document.getElementById('profit-west-total').textContent = fm(data.west.profit) + ' EUR';
        
        // 隐藏详细行
        document.getElementById('profit-west-tax-row').style.display = 'none';
        document.getElementById('profit-west-hsc-row').style.display = 'none';
        document.getElementById('profit-west-base-row').style.display = 'none';
        document.getElementById('profit-west-peercomm-row').style.display = 'none';
        document.getElementById('profit-west-netticket-row').style.display = 'none';
        document.getElementById('profit-west-addtax-row').style.display = 'none';
        document.getElementById('profit-west-addhsc-row').style.display = 'none';
        document.getElementById('profit-west-peerpay-row').style.display = 'none';
        
        // 德区
        document.getElementById('profit-german-actual').textContent = fm(data.german.actual) + ' EUR';
        document.getElementById('profit-german-cost').textContent = fm(data.german.cost) + ' EUR';
        document.getElementById('profit-german-total').textContent = fm(data.german.profit) + ' EUR';
        
        // 隐藏详细行
        document.getElementById('profit-german-tax-row').style.display = 'none';
        document.getElementById('profit-german-hsc-row').style.display = 'none';
        document.getElementById('profit-german-base-row').style.display = 'none';
        document.getElementById('profit-german-peercomm-row').style.display = 'none';
        document.getElementById('profit-german-netticket-row').style.display = 'none';
        document.getElementById('profit-german-addtax-row').style.display = 'none';
        document.getElementById('profit-german-addhsc-row').style.display = 'none';
        document.getElementById('profit-german-peerpay-row').style.display = 'none';
      }
    },

    // 清除输入
    clearInputs() {
      const ids = [
        // 西区输入
        'compareWest', 'compareWestTax', 'compareWestHsc', 'compareWestClub', 'compareWestSelection', 'compareWestDiscount', 'compareWestRate',
        // 德区输入
        'compareGerman', 'compareGermanTax', 'compareGermanHsc', 'compareGermanClub', 'compareGermanSelection', 'compareGermanDiscount', 'compareGermanRate',
        // 实际售价与同行返佣
        'compareActualPrice', 'peerCommissionRate', 'peerCommissionAmount'
      ];
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.value = '';
          const box = el.closest('.input-box');
          if (box) box.classList.remove('has-val');
        }
      });
    }
  };

  // 导出到全局
  window.CompareMode = CompareMode;
  window.clearCompareInputs = () => CompareMode.clearInputs();

  console.log('✅ Compare mode module loaded');
})();
