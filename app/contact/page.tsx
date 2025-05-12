import { Metadata } from "next"

export const metadata: Metadata = {
  title: "تماس با ما | Biosell",
  description: "تماس با ما - Biosell",
}

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">تماس با ما</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">شماره تماس</h2>
              <a 
                href="tel:061-42555049" 
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                061-42555049
              </a>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">ایمیل</h2>
              <div className="space-y-1">
                <a 
                  href="mailto:reza.apada@gmail.com" 
                  className="text-gray-600 hover:text-blue-600 transition-colors block"
                >
                  reza.apada@gmail.com
                </a>
                <a 
                  href="mailto:info@biosell.me" 
                  className="text-gray-600 hover:text-blue-600 transition-colors block"
                >
                  info@biosell.me
                </a>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">آدرس</h2>
              <p className="text-gray-600">
                خوزستان، دزفول، فرهنگ شهر، فرهنگ ۲۹ شرقی، پلاک ۳۱۱
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 