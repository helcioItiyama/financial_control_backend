const mongoose = require('mongoose');
const TransactionModel = require('../models/TransactionModel');

module.exports = {
  async listAllYears(req, res) {
    try {
      const getAllYears = [];
      const getAllTransactions = await TransactionModel.find().sort({year: -1, month: -1});
      
      getAllTransactions.forEach(({yearMonth}) => {
        if (!getAllYears.includes(yearMonth)) {
          getAllYears.push(yearMonth)
        }
      });

      res.send(getAllYears);
    } catch(err) {
      res.status(500).send(err)
    }
  },

  async list(req, res) {
    try {
      const { period } = req.query;
      const { filter } = req.query;
      
      if(!period || period && !period.includes('-')) {
        res.status(400).send("It's necessary to inform the params \"period\", follor by date format as yyyy-mm");
      }
      
      const [year, month] = period.split('-');
      
      if(month.length !== 2 || year.length !== 4) {
        res.status(400).send("It's necessary to inform the params \"period\", follor by date format as yyyy-mm");
      }

      let findTransactions = await TransactionModel.find({year, month}).sort({year: 1, month: 1, day: 1});
      
      if(!findTransactions) {
        res.status(400).send('Transactions not found')
      }

      const formattedLetter = (word) => {
        return word.replace(/[áàãâää]/ig, "a")
            .replace(/[éèêë]/ig, "e")
            .replace(/[íìîï]/ig, "i")
            .replace(/[óòôõö]/ig, "o")
            .replace(/[úùûü]/ig, "u")
            .replace(/[ç]/ig, "c")
            .replace(/[ñ]/ig, "n")
            .toLowerCase();
      }

      if(filter) {
        findTransactions = findTransactions.filter(transaction => {
          const filteredTransaction = transaction.category + transaction.description;
          return formattedLetter(filteredTransaction).includes(formattedLetter(filter))
        })
      }

      const { income, outcome } = findTransactions.reduce((total, {type, value}) => {
        if(type === '+') {
          total.income += value;
        } else if (type === '-') {
          total.outcome += value
        }
        return total;
      }, {income: 0, outcome: 0})

      const balance = income - outcome;

      const transactionNumber = findTransactions.length;

      res.send({findTransactions, income, outcome, transactionNumber, balance});

    } catch(err) {
      res.status(500).send(err)
    }
  },

  async create(req, res) {
    try {
      const data = req.body;

      if(!data) {
        res.status(400).send("Invalid Deposit")
      }

      const {description, value, category, type } = data;
      let { yearMonthDay } = data;
      let [year, month, day ] = yearMonthDay.split('-');
      const yearMonth = `${year}-${month}`;

      const deposit = new TransactionModel({
        description, 
        value, 
        category, 
        year: +year, 
        month: +month, 
        day: +day, 
        yearMonth, 
        yearMonthDay, 
        type 
      });

      await deposit.save();

      res.send(deposit);

    } catch(err) {
      res.status(500).send(err);
    }
  },

  async edit(req, res) {
    try {
      const data = req.body;
      const { id } = req.params;

      if(!data) {
        res.status(400).send("Invalid Deposit")
      }

      if(!id) {
        res.status(400).send("Transaction not found")
      }

      const {description, value, category, type } = data;
      let { yearMonthDay } = data;
      let [year, month, day ] = yearMonthDay.split('-');
      const yearMonth = `${year}-${month}`;
      
      const deposit = await TransactionModel.findByIdAndUpdate(id, {
        description, 
        value, 
        category, 
        type, 
        yearMonth, 
        yearMonthDay, 
        year, 
        month, 
        day
      }, {new: true});

      res.send(deposit);

    } catch(err) {
      res.status(500).send(err);
    }
  },

  async deleteOne(req, res) {
    try { 
      const {id} = req.params;

      if(!id) {
        res.status(400).send('Transaction not found')
      }

      await TransactionModel.findByIdAndDelete(id);
      res.send('Transaction deleted with success');

    } catch(err) {
      res.status(500).send(err)
    }
  } 

}
