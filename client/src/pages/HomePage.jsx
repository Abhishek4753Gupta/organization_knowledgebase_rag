import React from 'react';
import { Link } from 'react-router-dom';
import { Brain, Shield, Users, Zap, FileText, Search } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Zap className="h-4 w-4" />
          Powered by Gemini AI + RAG Fusion
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Your Organization's
          <span className="text-primary-600"> Private AI</span>
          <br />Knowledge Base
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Upload your documents, ask questions in natural language, and get grounded answers
          with source citations — all within your secure organization boundary.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="btn-primary text-base px-8 py-3">
            Register Your Organization
          </Link>
          <Link to="/login" className="btn-secondary text-base px-8 py-3">
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Enterprise-Grade RAG</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Shield, title: 'Multi-Tenant Isolation', desc: 'Each organization gets its own vector namespace in Pinecone. Your data never mixes with others.' },
            { icon: Search, title: 'RAG Fusion + RRF', desc: 'Multiple query variants merged with Reciprocal Rank Fusion for superior retrieval accuracy.' },
            { icon: FileText, title: 'Grounded Answers', desc: 'AI answers are strictly grounded to your uploaded documents with source citations.' },
            { icon: Users, title: 'Role-Based Access', desc: 'Admins manage documents and users. Team members query the knowledge base.' },
            { icon: Brain, title: 'Recursive Chunking', desc: 'Documents are split intelligently respecting semantic boundaries for better context.' },
            { icon: Zap, title: 'Gemini-Powered', desc: 'Uses Google Gemini for embeddings and generation with state-of-the-art accuracy.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card hover:shadow-md transition-shadow">
              <Icon className="h-10 w-10 text-primary-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
