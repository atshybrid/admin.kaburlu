import Head from 'next/head'

export default function ContactUs() {
  return (
    <>
      <Head>
        <title>Contact Us - Kaburlu Admin</title>
        <meta name="description" content="Get in touch with Kaburlu team" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Contact Us</h1>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Get in Touch</h2>
                <p className="text-gray-600">
                  We&apos;d love to hear from you! Whether you have questions, feedback, or need support, 
                  our team is here to help.
                </p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Email</h4>
                    <p className="text-gray-600">support@kaburlumedia.com</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Phone</h4>
                    <p className="text-gray-600">+91 123-456-7890</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Address</h4>
                    <p className="text-gray-600">
                      Kaburlu Media<br />
                      Hyderabad, Telangana<br />
                      India
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Business Hours</h3>
                <p className="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM IST</p>
                <p className="text-gray-600">Saturday - Sunday: Closed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
