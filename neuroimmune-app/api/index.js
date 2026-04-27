// API 统一入口
import patient from './patient'
import doctor from './doctor'
import followup from './followup'
import medication from './medication'
import medicalRecord from './medicalRecord'
import dashboard from './dashboard'
import auth from './auth'
import schedule from './schedule'
import episode from './episode'
import ocr from './ocr'
import dict from './dict'

export default {
  patient,
  doctor,
  followup,
  medication,
  medicalRecord,
  dashboard,
  auth,
  schedule,
  episode,
  ocr,
  dict
}